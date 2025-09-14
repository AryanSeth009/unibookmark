import useSWR from "swr"

export interface Collection {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  is_default: boolean
  created_at: string
  updated_at: string
  bookmarks?: { count: number }[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useCollections() {
  const { data, error, mutate } = useSWR("/api/collections", fetcher)

  // Transform data to include count and add "All Bookmarks" collection
  const collections = data?.collections || []
  const allBookmarksCount = collections.reduce((total: number, col: Collection) => {
    return total + (col.bookmarks?.[0]?.count || 0)
  }, 0)

  const transformedCollections = [
    {
      id: "all",
      name: "All Bookmarks",
      count: allBookmarksCount,
      isDefault: true,
      color: "#6366f1",
      icon: "bookmark",
    },
    ...collections.map((col: Collection) => ({
      id: col.id,
      name: col.name,
      count: col.bookmarks?.[0]?.count || 0,
      isDefault: col.is_default,
      color: col.color,
      icon: col.icon,
      description: col.description,
    })),
  ]

  return {
    collections: transformedCollections,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

export async function createCollection(collectionData: {
  name: string
  description?: string
  color?: string
  icon?: string
}) {
  const response = await fetch("/api/collections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collectionData),
  })

  if (!response.ok) {
    throw new Error("Failed to create collection")
  }

  return response.json()
}

export async function updateCollection(
  id: string,
  collectionData: {
    name?: string
    description?: string
    color?: string
    icon?: string
  },
) {
  const response = await fetch(`/api/collections/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collectionData),
  })

  if (!response.ok) {
    throw new Error("Failed to update collection")
  }

  return response.json()
}

export async function deleteCollection(id: string) {
  const response = await fetch(`/api/collections/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete collection")
  }

  return response.json()
}
