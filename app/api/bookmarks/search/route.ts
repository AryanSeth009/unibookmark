import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const includeArchived = searchParams.get("include_archived") === "true"

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Build search query
    let searchQuery = supabase
      .from("bookmarks")
      .select(`
        *,
        collections:collection_id (
          id,
          name,
          color,
          icon
        )
      `)
      .eq("user_id", user.id)

    if (!includeArchived) {
      searchQuery = searchQuery.eq("is_archived", false)
    }

    // Search across multiple fields with different weights
    searchQuery = searchQuery.or(
      `title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%,tags.cs.{${query}},ai_keywords.cs.{${query}}`,
    )

    searchQuery = searchQuery.order("created_at", { ascending: false }).limit(limit)

    const { data: bookmarks, error } = await searchQuery

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // Record search in history
    await supabase.from("search_history").insert({
      query,
      results_count: bookmarks.length,
      user_id: user.id,
    })

    // Sort results by relevance (basic implementation)
    const sortedBookmarks = bookmarks.sort((a, b) => {
      const aScore = calculateRelevanceScore(a, query)
      const bScore = calculateRelevanceScore(b, query)
      return bScore - aScore
    })

    return NextResponse.json(sortedBookmarks)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateRelevanceScore(bookmark: any, query: string): number {
  const lowerQuery = query.toLowerCase()
  let score = 0

  // Title match (highest weight)
  if (bookmark.title?.toLowerCase().includes(lowerQuery)) {
    score += 10
  }

  // Description match
  if (bookmark.description?.toLowerCase().includes(lowerQuery)) {
    score += 5
  }

  // URL match
  if (bookmark.url?.toLowerCase().includes(lowerQuery)) {
    score += 3
  }

  // Tags match
  if (bookmark.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) {
    score += 7
  }

  // AI keywords match
  if (bookmark.ai_keywords?.some((keyword: string) => keyword.toLowerCase().includes(lowerQuery))) {
    score += 6
  }

  // Boost for favorites
  if (bookmark.is_favorite) {
    score += 2
  }

  // Boost for recent bookmarks
  const daysSinceCreated = (Date.now() - new Date(bookmark.created_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreated < 7) {
    score += 1
  }

  return score
}
