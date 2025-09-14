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
    const collectionId = searchParams.get("collection")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const sort = searchParams.get("sort") || "created_at"
    const order = searchParams.get("order") || "desc"
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []
    const search = searchParams.get("search")

    let query = supabase
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
      .eq("is_archived", false)

    // Filter by collection
    if (collectionId && collectionId !== "all") {
      query = query.eq("collection_id", collectionId)
    }

    // Filter by tags
    if (tags.length > 0) {
      query = query.overlaps("tags", tags)
    }

    // Search functionality
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,url.ilike.%${search}%`)
    }

    // Sorting
    const validSortFields = ["created_at", "updated_at", "title", "last_accessed"]
    const sortField = validSortFields.includes(sort) ? sort : "created_at"
    const sortOrder = order === "asc" ? "asc" : "desc"

    query = query.order(sortField, { ascending: sortOrder === "asc" })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: bookmarks, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 })
    }

    return NextResponse.json(bookmarks)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, url, description, collection_id, tags, favicon_url, ai_category, ai_summary, ai_keywords } = body

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    // Check if bookmark already exists for this user
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("url", url)
      .single()

    if (existingBookmark) {
      return NextResponse.json({ error: "Bookmark already exists" }, { status: 409 })
    }

    // Estimate reading time and word count (basic implementation)
    const estimatedReadingTime = Math.ceil((description?.length || 0) / 1000) || 1
    const estimatedWordCount = description?.split(" ").length || 0

    const bookmarkData = {
      title,
      url,
      description: description || null,
      collection_id: collection_id || null,
      tags: tags || [],
      favicon_url: favicon_url || null,
      ai_category: ai_category || null,
      ai_summary: ai_summary || null,
      ai_keywords: ai_keywords || [],
      reading_time: estimatedReadingTime,
      word_count: estimatedWordCount,
      user_id: user.id,
    }

    const { data: bookmark, error } = await supabase.from("bookmarks").insert(bookmarkData).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create bookmark" }, { status: 500 })
    }

    // Record the creation in search history if it was a search result
    if (body.search_query) {
      await supabase.from("search_history").insert({
        query: body.search_query,
        results_count: 1,
        user_id: user.id,
      })
    }

    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
