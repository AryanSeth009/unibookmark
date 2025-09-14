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
    const { bookmarkIds, limit = 50 } = body

    // Get bookmarks to categorize
    let query = supabase
      .from("bookmarks")
      .select("id, title, url, description")
      .eq("user_id", user.id)
      .is("ai_category", null) // Only uncategorized bookmarks

    if (bookmarkIds && Array.isArray(bookmarkIds)) {
      query = query.in("id", bookmarkIds)
    }

    query = query.limit(limit)

    const { data: bookmarks, error } = await query

    if (error) {
      console.error("Failed to fetch bookmarks:", error)
      return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 })
    }

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({
        message: "No bookmarks to categorize",
        processed: 0,
        failed: 0,
      })
    }

    // Batch categorize bookmarks
    const categorizations = await aiCategorizer.batchCategorize(bookmarks)

    let processed = 0
    let failed = 0

    // Update bookmarks with categorization results
    for (const [bookmarkId, categoryResult] of categorizations) {
      try {
        const { error: updateError } = await supabase
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

        if (updateError) {
          console.error(`Failed to update bookmark ${bookmarkId}:`, updateError)
          failed++
        } else {
          processed++
        }
      } catch (error) {
        console.error(`Error updating bookmark ${bookmarkId}:`, error)
        failed++
      }
    }

    return NextResponse.json({
      message: "Batch categorization completed",
      processed,
      failed,
      total: bookmarks.length,
    })
  } catch (error) {
    console.error("Batch categorization error:", error)
    return NextResponse.json({ error: "Batch categorization failed" }, { status: 500 })
  }
}
