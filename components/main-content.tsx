"use client"
import { useState, useMemo } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BookmarkCard } from "@/components/bookmark-card"
import { BookmarkList } from "@/components/bookmark-list"
import { EmptyState } from "@/components/empty-state"
import { MasonryGrid } from "@/components/masonry-grid"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Bookmark, Collection, ViewMode, DateFilter } from "@/types/bookmark"
import { Search, Plus, Grid3X3, List, Filter, Calendar, Tag, Command, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface MainContentProps {
  bookmarks: Bookmark[]
  collections: Collection[]
  selectedCollection: string
  searchQuery: string
  selectedTags: string[]
  dateFilter: DateFilter
  viewMode: ViewMode
  onSearchChange: (query: string) => void
  onTagsChange: (tags: string[]) => void
  onDateFilterChange: (filter: DateFilter) => void
  onViewModeChange: (mode: ViewMode) => void
  onAddBookmark: () => void
  onEditBookmark: (bookmark: Bookmark) => void
  onDeleteBookmark: (bookmarkId: string) => void
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export function MainContent({
  bookmarks,
  collections,
  selectedCollection,
  searchQuery,
  selectedTags,
  dateFilter,
  viewMode,
  onSearchChange,
  onTagsChange,
  onDateFilterChange,
  onViewModeChange,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  searchInputRef,
}: MainContentProps) {
  const [showFilters, setShowFilters] = useState(false)

  // Get all unique tags from bookmarks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [bookmarks])

  // Filter bookmarks based on current filters
  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks

    // Filter by collection
    if (selectedCollection !== "all") {
      filtered = filtered.filter((bookmark) => bookmark.collectionId === selectedCollection)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          bookmark.description?.toLowerCase().includes(query) ||
          bookmark.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((bookmark) => selectedTags.every((tag) => bookmark.tags.includes(tag)))
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter((bookmark) => {
        const bookmarkDate = new Date(bookmark.createdAt)
        switch (dateFilter) {
          case "today":
            return bookmarkDate >= today
          case "week":
            return bookmarkDate >= weekAgo
          case "month":
            return bookmarkDate >= monthAgo
          default:
            return true
        }
      })
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [bookmarks, selectedCollection, searchQuery, selectedTags, dateFilter])

  const selectedCollectionName = collections.find((c) => c.id === selectedCollection)?.name || "All Bookmarks"

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const clearFilters = () => {
    onSearchChange("")
    onTagsChange([])
    onDateFilterChange("all")
  }

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || dateFilter !== "all"

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground text-balance bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {selectedCollectionName}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-muted-foreground">
                  {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? "s" : ""}
                  {filteredBookmarks.length !== bookmarks.length && ` of ${bookmarks.length} total`}
                </p>
                {filteredBookmarks.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>•</span>
                    <span>{filteredBookmarks.filter((b) => b.tags.length > 0).length} tagged</span>
                    <span>•</span>
                    <span>Updated {new Date().toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* <ThemeToggle /> */}
              <Button
                onClick={onAddBookmark}
                className="bg-primary hover:bg-primary/90  text-primary-foreground shadow-lg hover:shadow-2xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Bookmark
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2  transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search bookmarks... (⌘K)"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-16 bg-background/50 rounded-xl border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "transition-all duration-200 border-border/50 hover:border-primary/50",
                showFilters && "bg-accent text-accent-foreground border-primary/50",
                hasActiveFilters && "border-primary text-primary bg-primary/5",
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {(searchQuery ? 1 : 0) + selectedTags.length + (dateFilter !== "all" ? 1 : 0)}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-1 border border-border/50 rounded-lg p-1 bg-background/50">
              <Button
                variant={viewMode === "masonry" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("masonry" as ViewMode)}
                className="h-8 w-8 p-0"
                title="Masonry view"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="h-8 w-8 p-0"
                title="Grid view (⌘⇧V)"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="h-8 w-8 p-0"
                title="List view (⌘⇧V)"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 backdrop-blur-sm rounded-lg space-y-4 animate-in slide-in-from-top-2 duration-200 border border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Range
                  </label>
                  <Select value={dateFilter} onValueChange={onDateFilterChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags ({selectedTags.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/20">
        {filteredBookmarks.length === 0 ? (
          <EmptyState
            type={hasActiveFilters ? "no-results" : bookmarks.length === 0 ? "no-bookmarks" : "no-collection"}
            onAddBookmark={onAddBookmark}
            onClearFilters={hasActiveFilters ? clearFilters : undefined}
          />
        ) : viewMode === "masonry" ? (
          <MasonryGrid bookmarks={filteredBookmarks} onEdit={onEditBookmark} onDelete={onDeleteBookmark} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBookmarks.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} onEdit={onEditBookmark} onDelete={onDeleteBookmark} />
            ))}
          </div>
        ) : (
          <BookmarkList bookmarks={filteredBookmarks} onEdit={onEditBookmark} onDelete={onDeleteBookmark} />
        )}
      </div>
    </div>
  )
}
