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
    const period = searchParams.get("period") || "7d" // 7d, 30d, 90d, 1y

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get total bookmarks
    const { data: totalBookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_archived", false)

    // Get bookmarks created in period
    const { data: newBookmarks, error: newBookmarksError } = await supabase
      .from("bookmarks")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())

    // Get most visited bookmarks
    const { data: topBookmarks, error: topBookmarksError } = await supabase
      .from("bookmark_visits")
      .select(`
        bookmark_id,
        bookmarks!inner (
          id,
          title,
          url,
          favicon_url
        )
      `)
      .eq("user_id", user.id)
      .gte("visited_at", startDate.toISOString())

    // Get search history
    const { data: searchHistory, error: searchError } = await supabase
      .from("search_history")
      .select("query, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(10)

    // Get collections with bookmark counts
    const { data: collections, error: collectionsError } = await supabase
      .from("collections")
      .select(`
        id,
        name,
        color,
        bookmarks!inner (id)
      `)
      .eq("user_id", user.id)

    // Process top bookmarks
    const bookmarkVisits = new Map()
    topBookmarks?.forEach((visit) => {
      const bookmarkId = visit.bookmark_id
      if (!bookmarkVisits.has(bookmarkId)) {
        bookmarkVisits.set(bookmarkId, {
          bookmark: visit.bookmarks,
          visits: 0,
        })
      }
      bookmarkVisits.get(bookmarkId).visits++
    })

    const topBookmarksList = Array.from(bookmarkVisits.values())
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10)

    // Process collections data
    const collectionsData = collections?.map((collection) => ({
      id: collection.id,
      name: collection.name,
      color: collection.color,
      count: collection.bookmarks?.length || 0,
    }))

    // Get daily activity for chart
    const { data: dailyActivity, error: activityError } = await supabase
      .from("bookmarks")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    // Process daily activity
    const activityByDay = new Map()
    dailyActivity?.forEach((bookmark) => {
      const date = new Date(bookmark.created_at).toISOString().split("T")[0]
      activityByDay.set(date, (activityByDay.get(date) || 0) + 1)
    })

    const activityChart = Array.from(activityByDay.entries()).map(([date, count]) => ({
      date,
      bookmarks: count,
    }))

    const analytics = {
      overview: {
        totalBookmarks: totalBookmarks?.length || 0,
        newBookmarks: newBookmarks?.length || 0,
        totalCollections: collections?.length || 0,
        totalSearches: searchHistory?.length || 0,
      },
      topBookmarks: topBookmarksList,
      recentSearches: searchHistory || [],
      collections: collectionsData || [],
      activity: activityChart,
      period,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
