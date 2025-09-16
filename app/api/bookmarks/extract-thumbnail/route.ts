import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Extract thumbnail URL based on the website
    const thumbnailUrl = await extractThumbnailUrl(url)

    if (!thumbnailUrl) {
      return NextResponse.json({ error: "No thumbnail found" }, { status: 404 })
    }

    return NextResponse.json({ thumbnailUrl })
  } catch (error) {
    console.error("Thumbnail extraction error:", error)
    return NextResponse.json({ error: "Failed to extract thumbnail" }, { status: 500 })
  }
}

async function extractThumbnailUrl(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // YouTube thumbnail extraction
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return extractYouTubeThumbnail(url)
    }

    // Vimeo thumbnail extraction
    if (hostname.includes('vimeo.com')) {
      return extractVimeoThumbnail(url)
    }

    // Twitter/X thumbnail extraction
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return extractTwitterThumbnail(url)
    }

    // Instagram thumbnail extraction
    if (hostname.includes('instagram.com')) {
      return extractInstagramThumbnail(url)
    }

    // GitHub repository thumbnail
    if (hostname.includes('github.com')) {
      return extractGitHubThumbnail(url)
    }

    // Generic Open Graph thumbnail extraction
    return await extractOpenGraphThumbnail(url)
  } catch (error) {
    console.error("Error extracting thumbnail:", error)
    return null
  }
}

function extractYouTubeThumbnail(url: string): string | null {
  try {
    const urlObj = new URL(url)
    let videoId: string | null = null

    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v')
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1)
    }

    if (!videoId) return null

    // Return high-quality thumbnail
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  } catch {
    return null
  }
}

function extractVimeoThumbnail(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const videoId = urlObj.pathname.split('/').pop()
    
    if (!videoId) return null

    // Use Vimeo's oEmbed API to get thumbnail
    return `https://vumbnail.com/${videoId}.jpg`
  } catch {
    return null
  }
}

function extractTwitterThumbnail(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const tweetId = urlObj.pathname.split('/').pop()
    
    if (!tweetId) return null

    // Use Twitter's card API
    return `https://pbs.twimg.com/media/${tweetId}.jpg`
  } catch {
    return null
  }
}

function extractInstagramThumbnail(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const postId = urlObj.pathname.split('/').pop()
    
    if (!postId) return null

    // Instagram doesn't have direct thumbnail URLs, but we can try oEmbed
    return null // Will fall back to Open Graph
  } catch {
    return null
  }
}

function extractGitHubThumbnail(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    if (pathParts.length >= 2) {
      const owner = pathParts[0]
      const repo = pathParts[1]
      
      // Return GitHub repository's social preview image
      return `https://opengraph.githubassets.com/${Date.now()}/${owner}/${repo}`
    }
    
    return null
  } catch {
    return null
  }
}

async function extractOpenGraphThumbnail(url: string): Promise<string | null> {
  try {
    // Use a free service to extract Open Graph images
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=true`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      // Fallback to a simpler approach
      return await extractSimpleThumbnail(url)
    }

    const data = await response.json()
    return data.data?.image?.url || data.data?.screenshot?.url || null
  } catch (error) {
    console.error("OpenGraph extraction failed:", error)
    return await extractSimpleThumbnail(url)
  }
}

async function extractSimpleThumbnail(url: string): Promise<string | null> {
  try {
    // Simple fallback - try to get favicon or a generic image
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    
    // Return a generic placeholder or favicon
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`
  } catch {
    return null
  }
}
