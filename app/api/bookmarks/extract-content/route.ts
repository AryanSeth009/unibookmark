import { createClient } from "@/lib/supabase/server"
import { contentExtractor } from "@/lib/ai/content-extractor"
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
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Extract content from the URL
    const extractedContent = await contentExtractor.extractPageContent(url)

    return NextResponse.json(extractedContent)
  } catch (error) {
    console.error("Content extraction error:", error)
    return NextResponse.json({ error: "Content extraction failed" }, { status: 500 })
  }
}
