"use client"

import { useState, useRef, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { BookmarkModal } from "@/components/bookmark-modal"
import { QuickAddBookmark } from "@/components/quick-add-bookmark"
import { ExtensionPopup } from "@/components/extension-popup"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, Zap } from "lucide-react"
import { useBookmarks, createBookmark, updateBookmark, deleteBookmark, likeBookmark, unlikeBookmark } from "@/hooks/use-bookmarks"
import type { Bookmark, DateFilter } from "@/types/bookmark"
import { useCollections } from "@/hooks/use-collections"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"

export default function HomePage() {
  const [selectedCollection, setSelectedCollection] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showExtensionPopup, setShowExtensionPopup] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list" | "masonry">("masonry")
  const [user, setUser] = useState<User | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const {
    bookmarks,
    isLoading: bookmarksLoading,
    mutate: mutateBookmarks,
  } = useBookmarks(selectedCollection, debouncedSearch, selectedTags, user?.id)
  const { collections, isLoading: collectionsLoading, mutate: mutateCollections, createCollection, flatCollections } = useCollections()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push("/auth/login")
      }
      setUser(currentUser)
    }

    checkAuth()
  }, [router])

  const handleAddBookmark = async (bookmarkData: {
    title: string
    url: string
    description?: string
    collectionId?: string
    tags?: string[]
    favicon?: string
  }) => {
    try {
      await createBookmark({
        title: bookmarkData.title,
        url: bookmarkData.url,
        description: bookmarkData.description,
        collection_id: bookmarkData.collectionId,
        tags: bookmarkData.tags || [],
        favicon_url: bookmarkData.favicon,
      })

      // Refresh data
      mutateBookmarks()
      mutateCollections()

      toast({
        title: "Bookmark added",
        description: `"${bookmarkData.title}" has been saved to your collection.`,
      })

      setShowQuickAdd(false)
      setShowExtensionPopup(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bookmark. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setIsModalOpen(true)
  }

  const handleUpdateBookmark = async (bookmarkData: {
    title: string
    url: string
    description?: string
    collectionId?: string
    tags?: string[]
    favicon?: string
    thumbnailUrl?: string
  }) => {
    if (!editingBookmark) return

    try {
      await updateBookmark(editingBookmark.id, {
        title: bookmarkData.title,
        url: bookmarkData.url,
        description: bookmarkData.description,
        collection_id: bookmarkData.collectionId,
        tags: bookmarkData.tags || [],
        thumbnail_url: bookmarkData.thumbnailUrl,
      })

      // Refresh data
      mutateBookmarks()
      mutateCollections()
      setEditingBookmark(null)

      toast({
        title: "Bookmark updated",
        description: `"${bookmarkData.title}" has been updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBookmark = async (bookmarkId: string) => {
    const bookmark = bookmarks.find((b: Bookmark) => b.id === bookmarkId)
    if (!bookmark) return

    try {
      await deleteBookmark(bookmarkId)

      // Refresh data
      mutateBookmarks()
      mutateCollections()

      toast({
        title: "Bookmark deleted",
        description: `"${bookmark.title}" has been removed from your collection.`,
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bookmark. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLikeToggle = async (bookmarkId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeBookmark(bookmarkId)
        toast({ title: "Bookmark unliked" })
      } else {
        await likeBookmark(bookmarkId)
        toast({ title: "Bookmark liked" })
      }
      mutateBookmarks() // Revalidate bookmarks to show updated like count and status
    } catch (error) {
      toast({ title: "Error", description: "Failed to update like status", variant: "destructive" })
    }
  }

  const handleFavoriteToggle = async (bookmarkId: string, isFavorite: boolean) => {
    try {
      await updateBookmark(bookmarkId, { is_favorite: !isFavorite })
      mutateBookmarks() // Revalidate bookmarks to show updated favorite status
      toast({ title: "Bookmark favorite status updated" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to update favorite status", variant: "destructive" })
    }
  }

  const handleAddCollection = async (name: string, parentId?: string) => {
    try {
      await createCollection(name, parentId)

      // Refresh collections
      mutateCollections()

      toast({
        title: "Collection created",
        description: `"${name}" collection has been created.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFocusSearch = () => {
    searchInputRef.current?.focus()
  }

  const handleToggleView = () => {
    if (viewMode === "masonry") setViewMode("grid")
    else if (viewMode === "grid") setViewMode("list")
    else setViewMode("masonry")
  }

  const getRecentBookmarks = () => {
    return bookmarks
      .sort((a: Bookmark, b: Bookmark) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }

  if (bookmarksLoading || collectionsLoading) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-n8n-dark text-white font-inter relative flex"> {/* Applied n8n-dark background and Inter font, and kept flex for layout */}
      {/* Elegant Gradient Background - n8n style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] 
              bg-gradient-to-r from-n8n-purple/10 via-transparent to-n8n-teal/10 
              rotate-[-45deg] opacity-30 blur-3xl"></div>
      </div>
      
      <div className="fixed p-4 inset-0 z-0 select-none pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full">
              {/* Purple gradient lines - adjusted for n8n purple */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_45%,rgba(108,71,255,0.1)_45%,rgba(108,71,255,0.1)_55%,transparent_55%)]" />
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_35%,rgba(108,71,255,0.1)_35%,rgba(108,71,255,0.1)_45%,transparent_45%)]" />
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_25%,rgba(108,71,255,0.1)_25%,rgba(108,71,255,0.1)_35%,transparent_35%)]" />
          </div>
      </div>

      <div className="relative flex flex-1">
        <KeyboardShortcuts
          onAddBookmark={() => setIsModalOpen(true)}
          onSearch={handleFocusSearch}
          onToggleView={handleToggleView}
        />

        <Sidebar
          collections={collections}
          selectedCollection={selectedCollection}
          onSelectCollection={setSelectedCollection}
          onAddCollection={handleAddCollection}
        />

        <MainContent
          bookmarks={bookmarks}
          collections={collections}
          selectedCollection={selectedCollection}
          searchQuery={searchQuery}
          selectedTags={selectedTags}
          dateFilter={dateFilter}
          viewMode={viewMode}
          onSearchChange={setSearchQuery}
          onTagsChange={setSelectedTags}
          onDateFilterChange={setDateFilter}
          onViewModeChange={setViewMode}
          onAddBookmark={() => setIsModalOpen(true)}
          onEditBookmark={handleEditBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onLikeToggle={handleLikeToggle}
          onFavoriteToggle={handleFavoriteToggle}
          searchInputRef={searchInputRef}
        />

        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {/* Quick Add Button */}
          <Button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Zap className="w-5 h-5" />
          </Button>

          {/* Extension Popup Button */}
          <Button
            onClick={() => setShowExtensionPopup(!showExtensionPopup)}
            variant="outline"
            className="w-12 h-12 rounded-full bg-card hover:bg-muted shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {showQuickAdd && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="relative">
              <QuickAddBookmark
                onSave={handleAddBookmark}
                collections={flatCollections.filter((c) => c.id !== "all")}
                onClose={() => setShowQuickAdd(false)}
              />
            </div>
          </div>
        )}

        {showExtensionPopup && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="relative">
              <ExtensionPopup
                collections={flatCollections.filter((c) => c.id !== "all")}
                recentBookmarks={getRecentBookmarks()}
                onSaveBookmark={handleAddBookmark}
                onOpenFullApp={() => setShowExtensionPopup(false)}
              />
            </div>
          </div>
        )}

        <BookmarkModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingBookmark(null)
          }}
          onSave={editingBookmark ? handleUpdateBookmark : handleAddBookmark}
          collections={flatCollections.filter((c) => c.id !== "all")}
          editingBookmark={editingBookmark}
          onAddCollection={handleAddCollection}
        />

        <Toaster />
      </div>
    </div>
  )
}

