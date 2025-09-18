import useSWR, { mutate as swrMutate } from "swr"
import { useCallback } from "react"

export interface Collection {
  id: string
  name: string
  count: number
  isDefault: boolean
  icon?: string
  color?: string
  description?: string
  parentId?: string
  children?: Collection[]
}

const API_URL = "/api/collections"

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // @ts-ignore
    error.status = res.status
    throw error
  }
  
  const data = await res.json()
  
  // The first collection is the "All Bookmarks" virtual collection
  const [allBookmarks, ...apiCollections] = data
  
  // Map API fields to match types/bookmark.ts, and create initial flat collection objects
  const collectionMap = new Map<string, Collection>()
  apiCollections.forEach((col: any) => {
    collectionMap.set(col.id, {
      id: col.id,
      name: col.name,
      count: col.bookmark_count ?? col.count ?? 0,
      isDefault: col.is_default ?? false,
      icon: col.icon,
      color: col.color,
      description: col.description,
      parentId: col.parent_id ?? undefined,
      children: [], // Initialize children as empty array
    })
  })
  
  const rootCollections: Collection[] = []
  
  // Second pass: build the hierarchy
  collectionMap.forEach(col => {
    if (col.parentId && collectionMap.has(col.parentId)) {
      const parent = collectionMap.get(col.parentId)!
      parent.children!.push(col) // Add to parent's children
    } else {
      rootCollections.push(col) // This is a root collection
    }
  })
  
  return {
    allBookmarks: {
      id: allBookmarks.id,
      name: allBookmarks.name,
      count: allBookmarks.bookmark_count ?? allBookmarks.count ?? 0,
      isDefault: allBookmarks.is_default ?? false,
      icon: allBookmarks.icon,
      color: allBookmarks.color,
      description: allBookmarks.description,
      children: [],
    },
    collections: [
      {
        id: allBookmarks.id,
        name: allBookmarks.name,
        count: allBookmarks.bookmark_count ?? allBookmarks.count ?? 0,
        isDefault: allBookmarks.is_default ?? false,
        icon: allBookmarks.icon,
        color: allBookmarks.color,
        description: allBookmarks.description,
        children: [],
      },
      ...rootCollections,
    ],
    flatCollections: Array.from(collectionMap.values()),
    collectionMap,
  }
}

export function useCollections() {
  const { data, error, mutate } = useSWR(API_URL, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  })

  const createCollection = useCallback(async (name: string, parentId?: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          parentId: parentId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create collection')
      }

      const newCollection = await response.json()
      
      // Optimistic UI update
      await mutate(async (currentData) => {
        if (!currentData) return currentData
        
        const updatedCollections = [...currentData.collections]
        
        if (parentId) {
          // Find the parent collection and add the new subcollection
          const updateCollections = (collections: Collection[]): boolean => {
            return collections.some(collection => {
              if (collection.id === parentId) {
                if (!collection.children) collection.children = []
                collection.children.push({
                  ...newCollection,
                  children: [],
                  count: 0,
                })
                return true
              }
              if (collection.children) {
                return updateCollections(collection.children)
              }
              return false
            })
          }
          
          updateCollections(updatedCollections)
        } else {
          // Add as root collection
          updatedCollections.push({
            ...newCollection,
            children: [],
            count: 0,
          })
        }
        
        return {
          ...currentData,
          collections: updatedCollections,
          flatCollections: [...currentData.flatCollections, newCollection],
        }
      }, false)
      
      return newCollection
    } catch (error) {
      console.error("Error creating collection:", error)
      throw error
    }
  }, [mutate])

  const updateCollection = useCallback(async (
    id: string, 
    updates: Partial<Pick<Collection, 'name' | 'description' | 'color' | 'icon' | 'parentId'>>
  ) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update collection')
      }

      const updatedCollection = await response.json()
      
      // Optimistic UI update
      await mutate(async (currentData) => {
        if (!currentData) return currentData
        
        const updateInTree = (collections: Collection[]): boolean => {
          return collections.some((collection, index) => {
            if (collection.id === id) {
              collections[index] = { ...collection, ...updatedCollection }
              return true
            }
            if (collection.children) {
              return updateInTree(collection.children)
            }
            return false
          })
        }
        
        const updatedCollections = [...currentData.collections]
        updateInTree(updatedCollections)
        
        return {
          ...currentData,
          collections: updatedCollections,
          flatCollections: currentData.flatCollections.map(c => 
            c.id === id ? { ...c, ...updatedCollection } : c
          ),
        }
      }, false)
      
      return updatedCollection
    } catch (error) {
      console.error("Error updating collection:", error)
      throw error
    }
  }, [mutate])

  const deleteCollection = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete collection')
      }

      // Optimistic UI update
      await mutate(async (currentData) => {
        if (!currentData) return currentData
        
        const removeFromTree = (collections: Collection[]): boolean => {
          const index = collections.findIndex(c => c.id === id)
          if (index !== -1) {
            collections.splice(index, 1)
            return true
          }
          
          return collections.some(collection => 
            collection.children ? removeFromTree(collection.children) : false
          )
        }
        
        const updatedCollections = [...currentData.collections]
        removeFromTree(updatedCollections)
        
        return {
          ...currentData,
          collections: updatedCollections,
          flatCollections: currentData.flatCollections.filter(c => c.id !== id),
        }
      }, false)
      
      return true
    } catch (error) {
      console.error("Error deleting collection:", error)
      throw error
    }
  }, [mutate])

  return {
    allBookmarks: data?.allBookmarks,
    collections: data?.collections || [],
    flatCollections: data?.flatCollections || [], // Expose flatCollections
    collectionMap: data?.collectionMap,
    isLoading: !error && !data,
    isError: error,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    mutate,
  }
}

export const revalidateCollections = () => {
  swrMutate(API_URL)
}
