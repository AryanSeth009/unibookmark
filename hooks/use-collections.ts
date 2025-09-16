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

const fetcher = (url: string) =>
  fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })

export function useCollections() {
  const { data, error, mutate } = useSWR("/api/collections", fetcher)

  // API returns an array: [allCollection, ...collections]
  const collections = (Array.isArray(data) ? data : []) as any[]

  const transformedCollections = collections.map((col: any) => ({
    id: col.id,
    name: col.name,
    count: col.bookmark_count?.[0]?.count ?? col.bookmarks?.[0]?.count ?? 0,
    isDefault: !!col.is_default,
    color: col.color as string | undefined,
    icon: col.icon as string | undefined,
    description: col.description as string | undefined,
  }))

  // Deduplicate collections by name, prefer entries with URL icons or default flag
  const isUrlIcon = (icon?: string) => !!icon && (icon.startsWith("http://") || icon.startsWith("https://") || icon.endsWith(".svg"))
  const dedupedByName = Array.from(
    transformedCollections.reduce((acc, col) => {
      const key = (col.name || "").trim().toLowerCase()
      const existing = acc.get(key)
      if (!existing) {
        acc.set(key, col)
      } else {
        const preferNew = (isUrlIcon(col.icon) && !isUrlIcon(existing.icon)) || (col.isDefault && !existing.isDefault)
        if (preferNew) acc.set(key, col)
      }
      return acc
    }, new Map<string, typeof transformedCollections[number]>()),
  ).map(([, v]) => v)

  return {
    collections: dedupedByName,
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
    credentials: "include",
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
    credentials: "include",
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
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to delete collection")
  }

  return response.json()
}
