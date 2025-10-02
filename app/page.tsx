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
import { Plus, Zap, SkipBack, SkipForward, Play, Pause } from "lucide-react"
import { useBookmarks, createBookmark, updateBookmark, deleteBookmark, likeBookmark, unlikeBookmark } from "@/hooks/use-bookmarks"
import type { Bookmark, DateFilter } from "@/types/bookmark"
import { useCollections } from "@/hooks/use-collections"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import YouTubePlayer from "@/components/youtube-player"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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
  const [showSavedForLater, setShowSavedForLater] = useState(false);
  const [currentPlayingBookmark, setCurrentPlayingBookmark] = useState<Bookmark | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false); // Generic modal for all media
  const [isYoutubeApiReady, setIsYoutubeApiReady] = useState(false); 
  const [playlist, setPlaylist] = useState<Bookmark[]>([]);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null); // New ref for audio element
  const youtubePlayerRef = useRef<YT.Player | null>(null); // Ref for YouTube player instance

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
  } = useBookmarks(selectedCollection, debouncedSearch, 
    showSavedForLater ? ["save"] : selectedTags, 
    // Only fetch audio bookmarks if a music collection is selected
    selectedCollection === "music" ? "audio" : undefined,
    user?.id
  )

  console.log("showSavedForLater:", showSavedForLater);
  console.log("selectedTags for useBookmarks:", showSavedForLater ? ["save"] : selectedTags);
  console.log("Bookmarks in HomePage:", bookmarks);

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

  // Effect to control audio playback
  useEffect(() => {
    if (audioRef.current && currentPlayingBookmark?.mediaType === "audio") {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentPlayingBookmark]);

  // Effect to control YouTube playback
  useEffect(() => {
    if (youtubePlayerRef.current && currentPlayingBookmark?.mediaType === "video") {
      if (isPlaying) {
        youtubePlayerRef.current.playVideo();
      } else {
        youtubePlayerRef.current.pauseVideo();
      }
    }
  }, [isPlaying, currentPlayingBookmark]);

  useEffect(() => {
    // This function is called by the YouTube IFrame Player API when it's loaded
    window.onYouTubeIframeAPIReady = () => {
      setIsYoutubeApiReady(true);
    };
  }, []);

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

  const handleSaveForLater = async () => {
    const url = window.prompt("Enter the URL to save for later:");
    if (!url || url.trim() === "") {
      toast({
        title: "Cancelled",
        description: "Bookmark save cancelled.",
      });
      return;
    }

    try {
      await createBookmark({
        title: url, // Use URL as title by default
        url: url,
        tags: ["save"], // Add the "save" tag
      });
      mutateBookmarks();
      mutateCollections();
      toast({
        title: "Bookmark Saved",
        description: `URL saved for later: "${url}"`, 
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save bookmark for later. Please try again.",
        variant: "destructive",
      });
      console.error("Save for later error:", error);
    }
  };

  const handleShowSavedForLater = () => {
    setShowSavedForLater(true);
    setSelectedCollection("all"); // Reset collection filter when showing saved for later
    setSelectedTags(["save"]); // Explicitly set the "save" tag
  };

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

  const handlePlayMedia = (bookmark: Bookmark) => {
    if (!bookmark.mediaType) {
      console.warn("Bookmark has no mediaType, cannot play.", bookmark);
      return;
    }

    // If a music collection is selected, we manage a playlist
    if (selectedCollection === "music") {
      // Filter only audio bookmarks for the playlist
      const audioBookmarks = bookmarks.filter(b => b.mediaType === "audio");
      const initialIndex = audioBookmarks.findIndex(b => b.id === bookmark.id);

      setPlaylist(audioBookmarks);
      setCurrentPlayingIndex(initialIndex !== -1 ? initialIndex : 0);
      setCurrentPlayingBookmark(audioBookmarks[initialIndex !== -1 ? initialIndex : 0]);
    } else {
      // For other collections, just play the single media item
      setPlaylist([]);
      setCurrentPlayingIndex(0);
      setCurrentPlayingBookmark(bookmark);
    }
    setIsMediaModalOpen(true);
    setIsPlaying(true);
  };

  const handlePlayAllMusic = (bookmarksToPlay: Bookmark[]) => {
    if (bookmarksToPlay.length > 0) {
      setPlaylist(bookmarksToPlay);
      setCurrentPlayingIndex(0);
      setCurrentPlayingBookmark(bookmarksToPlay[0]);
      setIsMediaModalOpen(true);
      setIsPlaying(true);
    } else {
      toast({
        title: "No playable media",
        description: "No audio or video bookmarks found in this collection.",
        variant: "destructive",
      });
    }
  };

  const handleNextMedia = () => {
    if (playlist.length > 0 && currentPlayingIndex < playlist.length - 1) {
      const nextIndex = currentPlayingIndex + 1;
      setCurrentPlayingIndex(nextIndex);
      setCurrentPlayingBookmark(playlist[nextIndex]);
    } else if (playlist.length > 0) {
      // Loop back to the beginning if at the end of the playlist
      setCurrentPlayingIndex(0);
      setCurrentPlayingBookmark(playlist[0]);
    }
    setIsPlaying(true);
  };

  const handlePreviousMedia = () => {
    if (playlist.length > 0 && currentPlayingIndex > 0) {
      const prevIndex = currentPlayingIndex - 1;
      setCurrentPlayingIndex(prevIndex);
      setCurrentPlayingBookmark(playlist[prevIndex]);
    } else if (playlist.length > 0) {
      // Loop to the end if at the beginning of the playlist
      setCurrentPlayingIndex(playlist.length - 1);
      setCurrentPlayingBookmark(playlist[playlist.length - 1]);
    }
    setIsPlaying(true);
  };

  const handleMediaEnded = () => {
    if (playlist.length > 0 && currentPlayingIndex < playlist.length - 1) {
      const nextIndex = currentPlayingIndex + 1;
      setCurrentPlayingIndex(nextIndex);
      setCurrentPlayingBookmark(playlist[nextIndex]);
    } else {
      // End of playlist, stop playback
      setIsMediaModalOpen(false);
      setCurrentPlayingBookmark(null);
      setPlaylist([]);
      setCurrentPlayingIndex(0);
      setIsPlaying(false);
    }
  };

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
    <div className="h-full flex flex-1 bg-n8n-dark text-white font-inter relative"> {/* Applied n8n-dark background and Inter font, and kept flex for layout */}
      {/* console.log("app/page.tsx: rendering HomePage, playingVideoId:", playingVideoId, "isYoutubeModalOpen:", isYoutubeModalOpen, "isYoutubeApiReady:", isYoutubeApiReady) */}
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

      <div className="relative flex flex-1 overflow-y-auto">
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
          onSaveForLater={handleSaveForLater}
          onShowSavedForLater={handleShowSavedForLater}
        />

        <MainContent
          bookmarks={bookmarks}
          collections={collections}
          selectedCollection={selectedCollection}
          searchQuery={searchQuery}
          selectedTags={selectedTags}
          dateFilter={dateFilter}
          onSearchChange={setSearchQuery}
          onTagsChange={setSelectedTags}
          onDateFilterChange={setDateFilter}
          onAddBookmark={() => setIsModalOpen(true)}
          onEditBookmark={handleEditBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onLikeToggle={handleLikeToggle}
          onFavoriteToggle={handleFavoriteToggle}
          searchInputRef={searchInputRef}
          onPlayMedia={handlePlayMedia} // Changed prop name
          flatCollections={flatCollections}
          isPlaying={isPlaying}
          onNextMedia={handleNextMedia}
          onPreviousMedia={handlePreviousMedia}
          onPlayAllMusic={handlePlayAllMusic} // Pass the new handler
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

        {/* YouTube Player Modal */}
        <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Playing Media</DialogTitle>
              <DialogDescription>
                This media is playing in a separate window.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              {currentPlayingBookmark && (
                <h3 className="text-lg font-semibold mb-2 text-foreground">{currentPlayingBookmark.title}</h3>
              )}
              {currentPlayingBookmark && isYoutubeApiReady && currentPlayingBookmark.mediaType === "video" && (
                <YouTubePlayer
                  bookmark={currentPlayingBookmark}
                  isApiReady={isYoutubeApiReady}
                  onEnded={handleMediaEnded}
                  playerRef={youtubePlayerRef}
                />
              )}
              {currentPlayingBookmark && currentPlayingBookmark.mediaType === "audio" && (
                <audio ref={audioRef} controls autoPlay onEnded={handleMediaEnded} className="w-full">
                  <source src={currentPlayingBookmark.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}

              {currentPlayingBookmark && (playlist.length > 1 || currentPlayingBookmark.mediaType === "audio") && (
                <div className="flex items-center gap-4 mt-4">
                  <Button variant="ghost" size="icon" onClick={handlePreviousMedia} disabled={playlist.length === 0}>
                    <SkipBack className="w-6 h-6" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleNextMedia} disabled={playlist.length === 0}>
                    <SkipForward className="w-6 h-6" />
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

