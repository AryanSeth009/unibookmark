"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Bookmark } from "@/types/bookmark"
import { ExternalLink, MoreVertical, Edit, Trash2, Globe } from "lucide-react"

interface BookmarkListProps {
  bookmarks: Bookmark[]
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmarkId: string) => void
}

export function BookmarkList({ bookmarks, onEdit, onDelete }: BookmarkListProps) {
  const handleVisit = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleDelete = (bookmarkId: string) => {
    if (confirm("Are you sure you want to delete this bookmark?")) {
      onDelete(bookmarkId)
    }
  }

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="group flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all duration-200"
        >
          {/* Favicon */}
          <div className="flex-shrink-0">
            {bookmark.favicon ? (
              <img src={bookmark.favicon || "/placeholder.svg"} alt="" className="w-4 h-4 rounded" />
            ) : (
              <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                {getFaviconUrl(bookmark.url) ? (
                  <img src={getFaviconUrl(bookmark.url)! || "/placeholder.svg"} alt="" className="w-3 h-3" />
                ) : (
                  <Globe className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate mb-1">{bookmark.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span className="truncate">{getDomainFromUrl(bookmark.url)}</span>
                  <span>•</span>
                  <span>{bookmark.createdAt.toLocaleDateString()}</span>
                </div>
                {bookmark.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{bookmark.description}</p>
                )}
                {bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bookmark.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                    {bookmark.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        +{bookmark.tags.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => handleVisit(bookmark.url)} className="h-8 px-3">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Visit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(bookmark)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(bookmark.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
