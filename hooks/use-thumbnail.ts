import { useState, useEffect } from 'react'

interface UseThumbnailResult {
  thumbnailUrl: string | null
  isLoading: boolean
  error: string | null
}

export function useThumbnail(url: string): UseThumbnailResult {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setThumbnailUrl(null)
      setError(null)
      return
    }

    const extractThumbnail = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/bookmarks/extract-thumbnail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          throw new Error('Failed to extract thumbnail')
        }

        const data = await response.json()
        setThumbnailUrl(data.thumbnailUrl)
      } catch (err) {
        console.error('Thumbnail extraction error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setThumbnailUrl(null)
      } finally {
        setIsLoading(false)
      }
    }

    extractThumbnail()
  }, [url])

  return { thumbnailUrl, isLoading, error }
}

export async function extractThumbnailForUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch('/api/bookmarks/extract-thumbnail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.thumbnailUrl
  } catch (error) {
    console.error('Thumbnail extraction error:', error)
    return null
  }
}
