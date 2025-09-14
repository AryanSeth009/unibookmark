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

    const { data: preferences, error } = await supabase.from("user_preferences").select("*").eq("id", user.id).single()

    if (error && error.code !== "PGRST116") {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
    }

    // Return default preferences if none exist
    if (!preferences) {
      const defaultPreferences = {
        id: user.id,
        default_collection_id: null,
        auto_categorize: true,
        auto_screenshot: true,
        default_view_mode: "masonry",
        theme: "dark",
        language: "en",
        ai_suggestions: true,
        email_notifications: false,
        extension_shortcuts: {},
      }
      return NextResponse.json(defaultPreferences)
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      default_collection_id,
      auto_categorize,
      auto_screenshot,
      default_view_mode,
      theme,
      language,
      ai_suggestions,
      email_notifications,
      extension_shortcuts,
    } = body

    const updateData = {
      default_collection_id: default_collection_id || null,
      auto_categorize: auto_categorize ?? true,
      auto_screenshot: auto_screenshot ?? true,
      default_view_mode: default_view_mode || "masonry",
      theme: theme || "dark",
      language: language || "en",
      ai_suggestions: ai_suggestions ?? true,
      email_notifications: email_notifications ?? false,
      extension_shortcuts: extension_shortcuts || {},
      updated_at: new Date().toISOString(),
    }

    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .upsert({ id: user.id, ...updateData })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
