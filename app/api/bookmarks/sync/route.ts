import { createClient } from "@/lib/supabase/server"
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
    const { bookmarks } = body

    if (!Array.isArray(bookmarks)) {
      return NextResponse.json({ error: "Invalid bookmarks data" }, { status: 400 })
    }

    let imported = 0
    let skipped = 0
    let errors = 0

    // Get or create "Chrome Import" collection
    let { data: importCollection } = await supabase
      .from("collections")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", "Chrome Import")
      .single()

    if (!importCollection) {
      const { data: newCollection } = await supabase
        .from("collections")
        .insert({
          name: "Chrome Import",
          description: "Bookmarks imported from Chrome browser",
          color: "#4285f4",
          icon: "chrome",
          user_id: user.id,
        })
        .select("id")
        .single()

      importCollection = newCollection
    }

    // Process bookmarks in batches
    const batchSize = 50
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize)

      for (const bookmark of batch) {
        try {
          // Check if bookmark already exists
          const { data: existing } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", user.id)
            .eq("url", bookmark.url)
            .single()

          if (existing) {
            skipped++
            continue
          }

          // Create new bookmark
          const bookmarkData = {
            title: bookmark.title || "Untitled",
            url: bookmark.url,
            description: null,
            collection_id: importCollection?.id || null,
            tags: bookmark.parentTitle ? [bookmark.parentTitle] : [],
            favicon_url: `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`,
            user_id: user.id,
            created_at: bookmark.dateAdded || new Date().toISOString(),
          }

          const { error } = await supabase.from("bookmarks").insert(bookmarkData)

          if (error) {
            console.error("Failed to import bookmark:", error)
            errors++
          } else {
            imported++
          }
        } catch (error) {
          console.error("Error processing bookmark:", error)
          errors++
        }
      }
    }

    return NextResponse.json({
      message: "Sync completed",
      stats: {
        imported,
        skipped,
        errors,
        total: bookmarks.length,
      },
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
