import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookmarkId = params.id

    // Check if the bookmark exists and belongs to the user (or is public/shared)
    const { data: bookmark, error: bookmarkError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("id", bookmarkId)
      .eq("user_id", user.id) // Ensure user owns the bookmark, or implement public/shared logic
      .single()

    if (bookmarkError || !bookmark) {
      return NextResponse.json({ error: "Bookmark not found or unauthorized" }, { status: 404 })
    }

    const { data, error } = await supabase.from("bookmark_likes").insert({
      bookmark_id: bookmarkId,
      user_id: user.id,
    }).select().single()

    if (error) {
      // Handle unique constraint error for duplicate likes gracefully
      if (error.code === "23505") {
        return NextResponse.json({ message: "Bookmark already liked" }, { status: 200 })
      }
      console.error("Database error liking bookmark:", error)
      return NextResponse.json({ error: "Failed to like bookmark" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("API error liking bookmark:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookmarkId = params.id

    const { error } = await supabase
      .from("bookmark_likes")
      .delete()
      .eq("bookmark_id", bookmarkId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Database error unliking bookmark:", error)
      return NextResponse.json({ error: "Failed to unlike bookmark" }, { status: 500 })
    }

    return NextResponse.json({ message: "Bookmark unliked" }, { status: 200 })
  } catch (error) {
    console.error("API error unliking bookmark:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
