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
    const { title, url, description, category } = body

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 })
    }

    // Generate tag suggestions
    const suggestedTags = await aiCategorizer.suggestTags({
      title,
      url,
      description,
      category,
    })

    // Get user's existing tags for additional suggestions
    const { data: existingTags } = await supabase
      .from("bookmarks")
      .select("tags")
      .eq("user_id", user.id)
      .not("tags", "is", null)

    // Flatten and count existing tags
    const tagCounts = new Map<string, number>()
    existingTags?.forEach((bookmark) => {
      bookmark.tags?.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    // Get popular existing tags
    const popularTags = Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)

    return NextResponse.json({
      suggested: suggestedTags,
      popular: popularTags,
    })
  } catch (error) {
    console.error("Tag suggestion error:", error)
    return NextResponse.json({ error: "Tag suggestion failed" }, { status: 500 })
  }
}
