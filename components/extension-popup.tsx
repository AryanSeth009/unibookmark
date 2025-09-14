"use client"
import { useState } from "react"
import { QuickAddBookmark } from "./quick-add-bookmark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Bookmark, Collection } from "@/types/bookmark"
import { Search, Settings, Plus, Grid } from "lucide-react"

interface ExtensionPopupProps {
  collections: Collection[]
  recentBookmarks: Bookmark[]
  onSaveBookmark: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void
  onOpenFullApp: () => void
}

export function ExtensionPopup({ collections, recentBookmarks, onSaveBookmark, onOpenFullApp }: ExtensionPopupProps) {
  const [view, setView] = useState<"quick-add" | "recent">("quick-add")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBookmarks = recentBookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="w-80 max-h-96 bg-background border border-border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-semibold text-sm text-foreground">SmartBookmark.Ai</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onOpenFullApp} className="h-7 w-7 p-0">
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-md">
          <Button
            variant={view === "quick-add" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("quick-add")}
            className="flex-1 h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Quick Add
          </Button>
          <Button
            variant={view === "recent" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("recent")}
            className="flex-1 h-7 text-xs"
          >
            <Grid className="w-3 h-3 mr-1" />
            Recent
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {view === "quick-add" ? (
          <div className="p-4">
            <QuickAddBookmark
              onSave={onSaveBookmark}
              collections={collections}
              className="border-0 shadow-none p-0 bg-transparent"
            />
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search recent bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>

            {/* Recent Bookmarks */}
            <div className="space-y-2">
              {filteredBookmarks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Grid className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No recent bookmarks</p>
                </div>
              ) : (
                filteredBookmarks.slice(0, 5).map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                    onClick={() => window.open(bookmark.url, "_blank")}
                  >
                    <img
                      src={bookmark.favicon || "/placeholder.svg"}
                      alt=""
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=16&width=16&text=%E2%9C%82"
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate group-hover:text-primary">
                        {bookmark.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{new URL(bookmark.url).hostname}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredBookmarks.length > 5 && (
              <Button variant="outline" size="sm" onClick={onOpenFullApp} className="w-full h-7 text-xs bg-transparent">
                View All ({filteredBookmarks.length})
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
