import useSWR from "swr"

export interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  collection_id?: string
  tags: string[]
  is_favorite: boolean
  favicon_url?: string
  domain?: string
  created_at: string
  updated_at: string
  collections?: {
    id: string
    name: string
    color: string
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useBookmarks(collectionId?: string, search?: string, tags?: string[]) {
  const params = new URLSearchParams()
  if (collectionId && collectionId !== "all") params.set("collection_id", collectionId)
  if (search) params.set("search", search)
  if (tags && tags.length > 0) params.set("tags", tags.join(","))

  const { data, error, mutate } = useSWR(`/api/bookmarks?${params.toString()}`, fetcher)

  return {
    bookmarks: data?.bookmarks || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

export function useBookmark(id: string) {
  const { data, error, mutate } = useSWR(id ? `/api/bookmarks/${id}` : null, fetcher)

  return {
    bookmark: data?.bookmark,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

export async function createBookmark(bookmarkData: {
  title: string
  url: string
  description?: string
  collection_id?: string
  tags?: string[]
  favicon_url?: string
}) {
  const response = await fetch("/api/bookmarks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookmarkData),
  })

  if (!response.ok) {
    throw new Error("Failed to create bookmark")
  }

  return response.json()
}

export async function updateBookmark(
  id: string,
  bookmarkData: {
    title?: string
    url?: string
    description?: string
    collection_id?: string
    tags?: string[]
    is_favorite?: boolean
  },
) {
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookmarkData),
  })

  if (!response.ok) {
    throw new Error("Failed to update bookmark")
  }

  return response.json()
}

export async function deleteBookmark(id: string) {
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete bookmark")
  }

  return response.json()
}
