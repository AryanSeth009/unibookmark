import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- UPDATED: Default collections now use direct SVG icon URLs ---
    const defaultCollections = [
      { name: "YouTube", description: "Videos to watch", color: "#FF0000", icon: "https://cdn.simpleicons.org/youtube/FFFFFF" },
      { name: "Instagram", description: "Inspiration from Instagram", color: "#E1306C", icon: "https://cdn.simpleicons.org/instagram/FFFFFF" },
      { name: "Twitter", description: "Tweets and threads", color: "#1DA1F2", icon: "https://cdn.simpleicons.org/x/FFFFFF" },
      { name: "Read Later", description: "Items to read later", color: "#6366f1", icon: "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/book-open.svg" },
      { name: "Inspiration & Ideas", description: "Creative sparks and ideas", color: "#f59e0b", icon: "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/lightbulb.svg" },
      { name: "Shopping List", description: "Products to buy", color: "#10b981", icon: "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/shopping-cart.svg" },
    ];

    // Ensure default collections exist for this user
    const { data: existingCollections } = await supabase
      .from("collections")
      .select("name")
      .eq("user_id", user.id);

    const existingNames = new Set((existingCollections || []).map((c: any) => c.name));
    const toCreate = defaultCollections.filter((c) => !existingNames.has(c.name));
    
    if (toCreate.length > 0) {
      await supabase.from("collections").insert(
        toCreate.map((c) => ({
          name: c.name,
          description: c.description,
          color: c.color,
          icon: c.icon, // The icon URL is saved here
          user_id: user.id,
          is_default: true,
        })),
      );
    }

    // Fetch all collections for the user
    const { data: collections, error } = await supabase
      .from("collections")
      .select(
        `
        *,
        bookmark_count:bookmarks(count)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    // --- Add "All Bookmarks" virtual collection ---
    const { count: totalBookmarksCount } = await supabase
      .from("bookmarks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const allCollection = {
      id: "all",
      name: "All Bookmarks",
      description: "All your bookmarks",
      color: "#6c47ff",
      // --- UPDATED: Icon URL for "All Bookmarks" ---
      icon: "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/bookmark.svg", 
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bookmark_count: [{ count: totalBookmarksCount || 0 }],
    };

    return NextResponse.json([allCollection, ...collections]);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const collectionData = {
      name,
      description: description || null,
      color: color || "#6c47ff",
      icon: icon || "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/folder.svg",
      user_id: user.id,
      parent_id: parentId || null,
    };

    const { data: collection, error } = await supabase.from("collections").insert(collectionData).select().single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
    }

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
