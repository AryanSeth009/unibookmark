import { openai } from "@ai-sdk/openai"
import { generateObject, generateText } from "ai"
import { z } from "zod"

// Schema for AI categorization response
const CategorySchema = z.object({
  category: z.string().describe("Primary category for the bookmark"),
  subcategory: z.string().optional().describe("Optional subcategory"),
  tags: z.array(z.string()).describe("Relevant tags for the bookmark"),
  keywords: z.array(z.string()).describe("Important keywords extracted from content"),
  summary: z.string().describe("Brief summary of the bookmark content"),
  confidence: z.number().min(0).max(1).describe("Confidence score for categorization"),
})

export type BookmarkCategory = z.infer<typeof CategorySchema>

// Predefined categories for consistency
export const BOOKMARK_CATEGORIES = [
  "Technology",
  "Business",
  "Education",
  "Entertainment",
  "Health",
  "News",
  "Shopping",
  "Social",
  "Travel",
  "Finance",
  "Sports",
  "Science",
  "Art & Design",
  "Food & Cooking",
  "Productivity",
  "Development",
  "Marketing",
  "Research",
  "Documentation",
  "Tools",
] as const

export class AIBookmarkCategorizer {
  private model = openai("gpt-4o-mini")

  async categorizeBookmark(bookmarkData: {
    title: string
    url: string
    description?: string
    content?: string
  }): Promise<BookmarkCategory> {
    try {
      const prompt = this.buildCategorizationPrompt(bookmarkData)

      const result = await generateObject({
        model: this.model,
        schema: CategorySchema,
        prompt,
        temperature: 0.3, // Lower temperature for more consistent categorization
      })

      return result.object
    } catch (error) {
      console.error("AI categorization failed:", error)
      // Return fallback categorization
      return this.getFallbackCategory(bookmarkData)
    }
  }

  async generateSummary(content: string, maxLength = 200): Promise<string> {
    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Summarize the following content in ${maxLength} characters or less. Focus on the key points and main purpose:

${content.slice(0, 2000)}`, // Limit input to avoid token limits
        temperature: 0.3,
      })

      return text.slice(0, maxLength)
    } catch (error) {
      console.error("AI summary generation failed:", error)
      return content.slice(0, maxLength) + "..."
    }
  }

  async extractKeywords(content: string, maxKeywords = 10): Promise<string[]> {
    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Extract the ${maxKeywords} most important keywords from this content. Return them as a comma-separated list:

${content.slice(0, 1500)}`,
        temperature: 0.2,
      })

      return text
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0)
        .slice(0, maxKeywords)
    } catch (error) {
      console.error("AI keyword extraction failed:", error)
      return []
    }
  }

  async suggestTags(bookmarkData: {
    title: string
    url: string
    description?: string
    category?: string
  }): Promise<string[]> {
    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Based on this bookmark information, suggest 5-8 relevant tags that would help organize and find this bookmark later:

Title: ${bookmarkData.title}
URL: ${bookmarkData.url}
Description: ${bookmarkData.description || "No description"}
Category: ${bookmarkData.category || "Unknown"}

Return tags as a comma-separated list. Focus on practical, searchable terms.`,
        temperature: 0.4,
      })

      return text
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0 && tag.length < 30)
        .slice(0, 8)
    } catch (error) {
      console.error("AI tag suggestion failed:", error)
      return this.getFallbackTags(bookmarkData)
    }
  }

  async batchCategorize(
    bookmarks: Array<{
      id: string
      title: string
      url: string
      description?: string
    }>,
  ): Promise<Map<string, BookmarkCategory>> {
    const results = new Map<string, BookmarkCategory>()
    const batchSize = 5 // Process in small batches to avoid rate limits

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize)
      const promises = batch.map(async (bookmark) => {
        const category = await this.categorizeBookmark(bookmark)
        return { id: bookmark.id, category }
      })

      try {
        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ id, category }) => {
          results.set(id, category)
        })

        // Add delay between batches to respect rate limits
        if (i + batchSize < bookmarks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error("Batch categorization failed:", error)
        // Add fallback categories for failed batch
        batch.forEach((bookmark) => {
          results.set(bookmark.id, this.getFallbackCategory(bookmark))
        })
      }
    }

    return results
  }

  private buildCategorizationPrompt(bookmarkData: {
    title: string
    url: string
    description?: string
    content?: string
  }): string {
    const availableCategories = BOOKMARK_CATEGORIES.join(", ")

    return `Analyze this bookmark and categorize it appropriately:

Title: ${bookmarkData.title}
URL: ${bookmarkData.url}
Description: ${bookmarkData.description || "No description provided"}
${bookmarkData.content ? `Content Preview: ${bookmarkData.content.slice(0, 500)}` : ""}

Available categories: ${availableCategories}

Please categorize this bookmark by:
1. Selecting the most appropriate primary category from the available options
2. Optionally providing a more specific subcategory
3. Extracting 5-8 relevant tags that would help with organization and search
4. Identifying key keywords from the content
5. Writing a brief, informative summary (1-2 sentences)
6. Providing a confidence score (0-1) for your categorization

Consider the URL domain, title keywords, and content to make accurate categorizations. For technical content, prefer "Technology" or "Development". For business content, use "Business". Be specific with tags and keywords.`
  }

  private getFallbackCategory(bookmarkData: {
    title: string
    url: string
    description?: string
  }): BookmarkCategory {
    // Simple rule-based fallback categorization
    const title = bookmarkData.title.toLowerCase()
    const url = bookmarkData.url.toLowerCase()
    const description = (bookmarkData.description || "").toLowerCase()
    const combined = `${title} ${url} ${description}`

    let category = "Technology" // Default category
    const tags: string[] = []

    // Simple keyword matching for categories
    if (combined.includes("github") || combined.includes("code") || combined.includes("programming")) {
      category = "Development"
      tags.push("programming", "code")
    } else if (combined.includes("business") || combined.includes("startup") || combined.includes("entrepreneur")) {
      category = "Business"
      tags.push("business")
    } else if (combined.includes("learn") || combined.includes("tutorial") || combined.includes("course")) {
      category = "Education"
      tags.push("learning", "tutorial")
    } else if (combined.includes("news") || combined.includes("article")) {
      category = "News"
      tags.push("news", "article")
    } else if (combined.includes("tool") || combined.includes("app") || combined.includes("software")) {
      category = "Tools"
      tags.push("tools", "software")
    }

    // Extract domain as a tag
    try {
      const domain = new URL(bookmarkData.url).hostname.replace("www.", "")
      tags.push(domain)
    } catch {
      // Invalid URL, skip domain tag
    }

    return {
      category,
      subcategory: undefined,
      tags: tags.slice(0, 5),
      keywords: title
        .split(" ")
        .filter((word) => word.length > 3)
        .slice(0, 5),
      summary: bookmarkData.description || `Bookmark from ${bookmarkData.url}`,
      confidence: 0.6, // Lower confidence for fallback
    }
  }

  private getFallbackTags(bookmarkData: {
    title: string
    url: string
    description?: string
    category?: string
  }): string[] {
    const tags: string[] = []

    // Add category as tag
    if (bookmarkData.category) {
      tags.push(bookmarkData.category.toLowerCase())
    }

    // Extract domain
    try {
      const domain = new URL(bookmarkData.url).hostname.replace("www.", "")
      tags.push(domain)
    } catch {
      // Invalid URL
    }

    // Extract words from title
    const titleWords = bookmarkData.title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && word.length < 15)
      .slice(0, 3)

    tags.push(...titleWords)

    return tags.slice(0, 5)
  }
}

// Singleton instance
export const aiCategorizer = new AIBookmarkCategorizer()
