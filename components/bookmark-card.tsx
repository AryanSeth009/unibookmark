"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Bookmark } from "@/types/bookmark"
import { ExternalLink, MoreVertical, Edit, Trash2, Globe, Heart, BookmarkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookmarkCardProps {
  bookmark: Bookmark
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmarkId: string) => void
}

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleVisit = () => {
    window.open(bookmark.url, "_blank", "noopener,noreferrer")
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(bookmark)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this bookmark?")) {
      onDelete(bookmark.id)
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
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/20",
        "bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:bg-card/90",
        "overflow-hidden",
        isHovered && "scale-[1.02] -translate-y-1",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleVisit}
    >
      <div className="relative h-32 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {bookmark.favicon && !imageError ? (
            <img
              src={bookmark.favicon || "/placeholder.svg"}
              alt=""
              className="w-5 h-5 rounded bg-background/80 p-0.5"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-5 h-5 rounded bg-background/80 flex items-center justify-center">
              {getFaviconUrl(bookmark.url) && !imageError ? (
                <img
                  src={getFaviconUrl(bookmark.url)! || "/placeholder.svg"}
                  alt=""
                  className="w-4 h-4"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Globe className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          )}
          <span className="text-xs text-foreground font-medium bg-background/90 px-2 py-1 rounded-full backdrop-blur-sm border border-border/50">
            {getDomainFromUrl(bookmark.url)}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 leading-tight text-balance">{bookmark.title}</h3>

        {bookmark.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed">{bookmark.description}</p>
        )}

        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {bookmark.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "text-xs px-2.5 py-1 font-medium transition-colors border-border/50",
                  index === 0 && "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30",
                  index === 1 &&
                    "bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30 dark:text-secondary",
                  index === 2 && "bg-accent/20 text-accent border-accent/30 hover:bg-accent/30 dark:text-accent",
                )}
              >
                {tag}
              </Badge>
            ))}
            {bookmark.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs px-2.5 py-1 font-medium border-border/50 bg-muted/50 text-muted-foreground"
              >
                +{bookmark.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 text-xs transition-all duration-200",
                "opacity-0 group-hover:opacity-100",
                isLiked && "text-red-500 opacity-100",
              )}
              onClick={(e) => {
                e.stopPropagation()
                setIsLiked(!isLiked)
              }}
            >
              <Heart className={cn("w-3 h-3 mr-1.5", isLiked && "fill-current")} />
              Like
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 text-xs transition-all duration-200",
                "opacity-0 group-hover:opacity-100",
                isSaved && "text-primary opacity-100",
              )}
              onClick={(e) => {
                e.stopPropagation()
                setIsSaved(!isSaved)
              }}
            >
              <BookmarkIcon className={cn("w-3 h-3 mr-1.5", isSaved && "fill-current")} />
              Save
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            onClick={(e) => {
              e.stopPropagation()
              handleVisit()
            }}
          >
            <ExternalLink className="w-3 h-3 mr-1.5" />
            Visit
          </Button>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Added{" "}
            {bookmark.createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: bookmark.createdAt.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
