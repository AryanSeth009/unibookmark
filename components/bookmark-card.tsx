"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Bookmark } from "@/types/bookmark"
import { ExternalLink, MoreVertical, Edit, Trash2, Globe, Heart, BookmarkIcon, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useThumbnail } from "@/hooks/use-thumbnail"

interface BookmarkCardProps {
  bookmark: Bookmark
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmarkId: string) => void
  onLikeToggle: (bookmarkId: string, isLiked: boolean) => void // New prop for like toggle
  onFavoriteToggle: (bookmarkId: string, isFavorite: boolean) => void // New prop for favorite toggle
}

export function BookmarkCard({ bookmark, onEdit, onDelete, onLikeToggle, onFavoriteToggle }: BookmarkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { thumbnailUrl, isLoading: thumbnailLoading } = useThumbnail(bookmark.url)

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
    <div className="n8n-3d-container">
      <Card
        className={cn(
          "n8n-3d-card group cursor-pointer transition-all min-h-56 duration-300",
          "bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:bg-card/90",
          "overflow-hidden n8n-glass",
          "hover:shadow-2xl hover:shadow-primary/20",
          isHovered && "n8n-glow",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleVisit}
      >
      <div 
        className="relative n8n-3d-bg bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 overflow-hidden h-24"
        style={{
          backgroundImage: thumbnailUrl 
            ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(${thumbnailUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute inset-0 n8n-float" style={{ animationDelay: `${Math.random() * 2}s` }} />
        {thumbnailLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <ImageIcon className="w-6 h-6 text-white/60 animate-pulse" />
          </div>
        )}
        <div className="absolute top-3 right-3 z-10 n8n-depth-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="n8n-3d-button h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/80 backdrop-blur-sm hover:bg-background/90 n8n-interactive-3d"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="n8n-glass">
              <DropdownMenuItem onClick={handleEdit} className="n8n-interactive-3d">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive n8n-interactive-3d">
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

      <CardContent className="p-5 n8n-depth-2 flex-1 flex flex-col">
        <h3 className="n8n-3d-text font-semibold text-foreground mb-3 line-clamp-2 leading-tight text-balance">{bookmark.title}</h3>

        {bookmark.description && (
          <p className="n8n-3d-text text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed flex-1">{bookmark.description}</p>
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

        <div className="flex items-center justify-between n8n-depth-3 mt-auto">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "n8n-3d-button h-8 px-3 text-xs transition-all duration-200",
                "opacity-0 group-hover:opacity-100 n8n-interactive-3d",
                bookmark.isLiked && "text-red-500 opacity-100 n8n-glow-accent", // Use bookmark.isLiked
              )}
              onClick={(e) => {
                e.stopPropagation()
                onLikeToggle(bookmark.id, bookmark.isLiked || false) // Call new prop
              }}
            >
              <Heart className={cn("w-3 h-3 mr-1.5", bookmark.isLiked && "fill-current")} />
              {bookmark.likesCount || 0} Like
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "n8n-3d-button h-8 px-3 text-xs transition-all duration-200",
                "opacity-0 group-hover:opacity-100 n8n-interactive-3d",
                bookmark.isFavorite && "text-primary opacity-100 n8n-glow", // Use bookmark.isFavorite
              )}
              onClick={(e) => {
                e.stopPropagation()
                onFavoriteToggle(bookmark.id, bookmark.isFavorite || false) // Call new prop
              }}
            >
              <BookmarkIcon className={cn("w-3 h-3 mr-1.5", bookmark.isFavorite && "fill-current")} />
              Save
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="n8n-3d-button h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 hover:text-primary n8n-interactive-3d"
            onClick={(e) => {
              e.stopPropagation()
              handleVisit()
            }}
          >
            <ExternalLink className="w-3 h-3 mr-1.5" />
            Visit
          </Button>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground n8n-3d-text">
            Added{" "}
            {(() => {
              try {
                const d = bookmark.createdAt ? new Date(bookmark.createdAt) : undefined
                return d
                  ? d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                    })
                  : ""
              } catch {
                return ""
              }
            })()}
          </p>
        </div>
      </CardContent>
      </Card>
    </div>
  )
}
