import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: bookmark, error } = await supabase
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
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Bookmark not found" }, { status: 404 })
      }
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch bookmark" }, { status: 500 })
    }

    // Note: analytics tables or columns may not exist in all deployments
    // Intentionally skipping analytics writes to avoid runtime errors

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const inferMediaTypeFromUrl = (url: string): "audio" | "video" | "other" => {
      // Simplified Regex for YouTube URLs (including music.youtube.com)
      const youtubeRegex = /(youtube\.com|youtu\.be|music\.youtube\.com)/i;
      // Regex for common audio file extensions
      const audioRegex = /\.(mp3|wav|ogg|aac|flac|m4a)$/i

      let detectedMediaType: "audio" | "video" | "other" = "other";

      if (youtubeRegex.test(url)) {
        detectedMediaType = "video"
      } else if (audioRegex.test(url)) {
        detectedMediaType = "audio"
      }
      console.log(`Inferring mediaType for URL: ${url} -> ${detectedMediaType}`);
      return detectedMediaType;
    }

    const body = await request.json()
    const { title, url, description, collection_id, tags, is_favorite, thumbnail_url } = body

    const mediaType = inferMediaTypeFromUrl(url)

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    const updateData = {
      title,
      url,
      description: description || null,
      collection_id: collection_id || null,
      tags: tags || [],
      is_favorite: is_favorite || false,
      thumbnail_url: thumbnail_url || null,
      media_type: mediaType,
      updated_at: new Date().toISOString(),
    }

    const { data: bookmark, error } = await supabase
      .from("bookmarks")
      .update(updateData)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Bookmark not found" }, { status: 404 })
      }
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update bookmark" }, { status: 500 })
    }

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("bookmarks").delete().eq("id", params.id).eq("user_id", user.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete bookmark" }, { status: 500 })
    }

    return NextResponse.json({ message: "Bookmark deleted successfully" })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
