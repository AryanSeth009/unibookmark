import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { count: bookmarkCount, error: countError } = await supabase
      .from("bookmarks")
      .select("count", { count: "exact" })
      .eq("user_id", user.id)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    return NextResponse.json({ profile: { ...profile, bookmark_count: bookmarkCount } })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, avatar_url } = body

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({ full_name, avatar_url })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
