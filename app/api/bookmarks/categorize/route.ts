import { createClient } from "@/lib/supabase/server"
import { aiCategorizer } from "@/lib/ai/categorizer"
import { type NextRequest, NextResponse } from "next/server"

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
    const { bookmarkId, title, url, description, content } = body

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    // Categorize the bookmark using AI
    const categoryResult = await aiCategorizer.categorizeBookmark({
      title,
      url,
      description,
      content,
    })

    // If bookmarkId is provided, update the existing bookmark
    if (bookmarkId) {
      const { data: bookmark, error } = await supabase
        .from("bookmarks")
        .update({
          ai_category: categoryResult.category,
          ai_summary: categoryResult.summary,
          ai_keywords: categoryResult.keywords,
          tags: categoryResult.tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookmarkId)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        console.error("Failed to update bookmark:", error)
        return NextResponse.json({ error: "Failed to update bookmark" }, { status: 500 })
      }

      return NextResponse.json({
        bookmark,
        categorization: categoryResult,
      })
    }

    // Otherwise, just return the categorization result
    return NextResponse.json({
      categorization: categoryResult,
    })
  } catch (error) {
    console.error("Categorization error:", error)
    return NextResponse.json({ error: "Categorization failed" }, { status: 500 })
  }
}
