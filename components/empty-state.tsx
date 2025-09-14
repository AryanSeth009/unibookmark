"use client"

import { Button } from "@/components/ui/button"
import { Bookmark, Search, Plus, Filter } from "lucide-react"

interface EmptyStateProps {
  type: "no-bookmarks" | "no-results" | "no-collection"
  onAddBookmark?: () => void
  onClearFilters?: () => void
}

export function EmptyState({ type, onAddBookmark, onClearFilters }: EmptyStateProps) {
  const configs = {
    "no-bookmarks": {
      icon: Bookmark,
      title: "No bookmarks yet",
      description: "Start building your digital library by adding your first bookmark",
      action: onAddBookmark && (
        <Button onClick={onAddBookmark} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Bookmark
        </Button>
      ),
    },
    "no-results": {
      icon: Search,
      title: "No bookmarks found",
      description: "Try adjusting your search terms or filters to find what you're looking for",
      action: onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          <Filter className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      ),
    },
    "no-collection": {
      icon: Bookmark,
      title: "Collection is empty",
      description: "This collection doesn't have any bookmarks yet",
      action: onAddBookmark && (
        <Button onClick={onAddBookmark} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Bookmark
        </Button>
      ),
    },
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2 text-foreground">{config.title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{config.description}</p>
      {config.action}
    </div>
  )
}
