import useSWR from "swr"
import type { Bookmark } from "@/types/bookmark"

const fetcher = (url: string) =>
  fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })

function transformBookmark(raw: any): Bookmark {
  return {
    id: raw.id,
    title: raw.title,
    url: raw.url,
    description: raw.description ?? undefined,
    collectionId: raw.collection_id ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
    favicon: raw.favicon_url ?? undefined,
    thumbnailUrl: raw.thumbnail_url ?? undefined,
    isFavorite: raw.is_favorite ?? false,
    likesCount: raw.likes_count ?? 0,
    isLiked: raw.is_liked ?? false,
  }
}

export function useBookmarks(collectionId?: string, search?: string, tags?: string[], currentUserId?: string) {
  const params = new URLSearchParams()
  if (collectionId) params.set("collection", collectionId)
  if (search) params.set("search", search)
  if (tags && tags.length > 0) params.set("tags", tags.join(","))

  const { data, error, mutate } = useSWR(`/api/bookmarks?${params.toString()}`, fetcher)

  return {
    bookmarks: Array.isArray(data) ? (data as any[]).map(transformBookmark) : [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

export function useBookmark(id: string) {
  const { data, error, mutate } = useSWR(id ? `/api/bookmarks/${id}` : null, fetcher)

  return {
    bookmark: data ? (transformBookmark(data) as Bookmark) : undefined,
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
  thumbnail_url?: string
}) {
  const response = await fetch("/api/bookmarks", {
    method: "POST",
    credentials: "include",
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
    thumbnail_url?: string
  },
) {
  const response = await fetch(`/api/bookmarks/${id}`, {
    method: "PUT",
    credentials: "include",
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
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to delete bookmark")
  }

  return response.json()
}

export async function likeBookmark(id: string) {
  const response = await fetch(`/api/bookmarks/${id}/like`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to like bookmark")
  }

  return response.json()
}

export async function unlikeBookmark(id: string) {
  const response = await fetch(`/api/bookmarks/${id}/like`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to unlike bookmark")
  }

  return response.json()
}
