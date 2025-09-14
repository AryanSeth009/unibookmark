export class ContentExtractor {
  async extractPageContent(url: string): Promise<{
    title: string
    description: string
    content: string
    favicon: string
    language: string
    readingTime: number
    wordCount: number
  }> {
    try {
      // In a real implementation, you would use a service like:
      // - Puppeteer/Playwright for scraping
      // - Mercury Parser API
      // - Readability.js
      // - Custom scraping service

      // For now, we'll simulate content extraction
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SmartBookmark.AI/1.0 (+https://smartbookmark.ai)",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()

      // Basic HTML parsing (in production, use a proper HTML parser)
      const title = this.extractTitle(html)
      const description = this.extractDescription(html)
      const content = this.extractTextContent(html)
      const favicon = this.extractFavicon(html, url)
      const language = this.extractLanguage(html)
      const wordCount = this.countWords(content)
      const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

      return {
        title,
        description,
        content,
        favicon,
        language,
        readingTime,
        wordCount,
      }
    } catch (error) {
      console.error("Content extraction failed:", error)

      // Return fallback data
      return {
        title: this.extractTitleFromUrl(url),
        description: "",
        content: "",
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
        language: "en",
        readingTime: 1,
        wordCount: 0,
      }
    }
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) return titleMatch[1].trim()

    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    if (ogTitleMatch) return ogTitleMatch[1].trim()

    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1Match) return h1Match[1].trim()

    return "Untitled"
  }

  private extractDescription(html: string): string {
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
    if (descMatch) return descMatch[1].trim()

    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)
    if (ogDescMatch) return ogDescMatch[1].trim()

    return ""
  }

  private extractTextContent(html: string): string {
    // Remove script and style tags
    let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, " ")

    // Clean up whitespace
    content = content.replace(/\s+/g, " ").trim()

    return content.slice(0, 2000) // Limit content length
  }

  private extractFavicon(html: string, url: string): string {
    const faviconMatch = html.match(/<link[^>]*rel="(?:icon|shortcut icon)"[^>]*href="([^"]+)"/i)
    if (faviconMatch) {
      const faviconUrl = faviconMatch[1]
      if (faviconUrl.startsWith("http")) {
        return faviconUrl
      } else {
        return new URL(faviconUrl, url).href
      }
    }

    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }

  private extractLanguage(html: string): string {
    const langMatch = html.match(/<html[^>]*lang="([^"]+)"/i)
    if (langMatch) return langMatch[1].split("-")[0] // Get primary language code

    return "en"
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname

      if (pathname === "/" || pathname === "") {
        return urlObj.hostname.replace("www.", "")
      }

      return pathname.split("/").pop()?.replace(/[-_]/g, " ") || urlObj.hostname
    } catch {
      return "Untitled"
    }
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }
}

export const contentExtractor = new ContentExtractor()
