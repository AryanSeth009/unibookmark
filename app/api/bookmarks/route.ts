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
    const mediaType = searchParams.get("mediaType")

    let query = supabase
      .from("bookmarks")
      .select(`
        *,
        collections:collection_id (
          id,
          name,
          color,
          icon,
          parent_id
        ),
        is_favorite
      `)
      .eq("user_id", user.id)
      

    // Fetch all collections to build hierarchy for subcollection filtering
    const { data: allCollections, error: collectionsError } = await supabase
      .from("collections")
      .select("id, parent_id");

    if (collectionsError) {
      console.error("Error fetching collections:", collectionsError);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    const collectionMap = new Map<string, { id: string; parent_id: string | null; children: string[] }>();
    allCollections.forEach(col => {
      collectionMap.set(col.id, { ...col, children: [] });
    });

    allCollections.forEach(col => {
      if (col.parent_id && collectionMap.has(col.parent_id)) {
        collectionMap.get(col.parent_id)!.children.push(col.id);
      }
    });

    const getDescendantCollectionIds = (id: string): string[] => {
      const descendants: string[] = [];
      const queue: string[] = [id];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        descendants.push(currentId);
        const collection = collectionMap.get(currentId);
        if (collection && collection.children.length > 0) {
          queue.push(...collection.children);
        }
      }
      return descendants;
    };

    // Filter by collection (including subcollections)
    if (collectionId && collectionId !== "all") {
      const relevantCollectionIds = getDescendantCollectionIds(collectionId);
      query = query.in("collection_id", relevantCollectionIds);
    }

    // Filter by tags
    if (tags.length > 0) {
      query = query.overlaps("tags", tags)
    }

    // Filter by media type
    if (mediaType) {
      query = query.eq("media_type", mediaType)
    }

    // Search functionality
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,url.ilike.%${search}%`)
    }

    // Sorting
    const validSortFields = ["created_at", "updated_at", "title"]
    const sortField = validSortFields.includes(sort) ? sort : "created_at"
    const sortOrder = order === "asc" ? "asc" : "desc"

    query = query.order(sortField, { ascending: sortOrder === "asc" })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: bookmarks, error: fetchError } = await query

    if (fetchError) {
      console.error("Database error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 })
    }

    const bookmarksWithEngagement = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const { data: engagementData, error: engagementError } = await supabase.rpc(
            'get_bookmark_engagement', 
            { bookmark_id_param: bookmark.id, user_id_param: user.id }
          ).single();

        if (engagementError || !engagementData) {
          console.warn(`Failed to fetch engagement for bookmark ${bookmark.id}:`, engagementError || "No engagement data");
          return { ...bookmark, likes_count: 0, is_liked: false };
        }
        const engagement = engagementData as { likes_count: number; is_liked: boolean; };
        return { ...bookmark, likes_count: engagement.likes_count, is_liked: engagement.is_liked };
      })
    )

    return NextResponse.json(bookmarksWithEngagement)
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

    const inferMediaTypeFromUrl = (url: string): "audio" | "video" | "other" => {
      // Robust Regex for YouTube URLs (including music.youtube.com) to capture video ID
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be|music\.youtube\.com)\/(?:(?:watch\?v=|embed\/|v\/)|)([-\w]{11})(?:\S+)?/i;
      // Regex for common audio file extensions
      const audioRegex = /\.(mp3|wav|ogg|aac|flac|m4a)$/i

      let detectedMediaType: "audio" | "video" | "other" = "other";

      if (youtubeRegex.test(url) || url.includes("music.youtube.com")) {
        detectedMediaType = "video"
      } else if (audioRegex.test(url)) {
        detectedMediaType = "audio"
      }
      console.log(`Inferring mediaType for URL: ${url} -> ${detectedMediaType} (youtubeRegex match: ${youtubeRegex.test(url)}, includes music.youtube.com: ${url.includes("music.youtube.com")})`);
      return detectedMediaType;
    }

    const body = await request.json()
    const { title, url, description, collection_id, tags, favicon_url, thumbnail_url } = body

    const mediaType = inferMediaTypeFromUrl(url)

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    // Check if bookmark already exists for this user
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("url", url)
      .single()

    if (existingBookmark) {
      // Merge tags if new tags are provided
      if (Array.isArray(tags) && tags.length > 0) {
        const mergedTags = Array.from(new Set([...(existingBookmark.tags || []), ...tags]))
        const { data: updated, error: mergeError } = await supabase
          .from("bookmarks")
          .update({ tags: mergedTags, updated_at: new Date().toISOString() })
          .eq("id", existingBookmark.id)
          .eq("user_id", user.id)
          .select("*")
          .single()
        if (!mergeError && updated) {
          return NextResponse.json(updated, { status: 200 })
        }
      }
      // Return existing bookmark without error
      return NextResponse.json(existingBookmark, { status: 200 })
    }

    // Check current bookmark count for the user
    const { count, error: countError } = await supabase
      .from("bookmarks")
      .select("count", { count: "exact" })
      .eq("user_id", user.id)

    if (countError) {
      console.error("Database error fetching bookmark count:", countError)
      return NextResponse.json({ error: "Failed to check bookmark limit" }, { status: 500 })
    }

    const BOOKMARK_LIMIT = 50
    if (count && count >= BOOKMARK_LIMIT) {
      return NextResponse.json({ error: `You have reached the maximum of ${BOOKMARK_LIMIT} bookmarks.` }, { status: 403 })
    }

    const bookmarkData = {
      title,
      url,
      description: description || null,
      collection_id: collection_id || null,
      tags: tags || [],
      favicon_url: favicon_url || null,
      thumbnail_url: thumbnail_url || null,
      media_type: mediaType,
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
