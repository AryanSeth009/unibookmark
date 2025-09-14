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

    const { data: collections, error } = await supabase
      .from("collections")
      .select(`
        *,
        bookmark_count:bookmarks(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 })
    }

    // Add "All Bookmarks" virtual collection
    const { data: totalBookmarks } = await supabase
      .from("bookmarks")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_archived", false)

    const allCollection = {
      id: "all",
      name: "All Bookmarks",
      description: "All your bookmarks",
      color: "#6c47ff",
      icon: "bookmark",
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bookmark_count: [{ count: totalBookmarks?.length || 0 }],
    }

    return NextResponse.json([allCollection, ...collections])
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
    const { name, description, color, icon } = body

    if (!name) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 })
    }

    const collectionData = {
      name,
      description: description || null,
      color: color || "#6c47ff",
      icon: icon || "folder",
      user_id: user.id,
    }

    const { data: collection, error } = await supabase.from("collections").insert(collectionData).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create collection" }, { status: 500 })
    }

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
