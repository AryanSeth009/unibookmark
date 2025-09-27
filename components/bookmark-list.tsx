"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Bookmark } from "@/types/bookmark"
import { ExternalLink, MoreVertical, Edit, Trash2, Globe, Heart, BookmarkIcon, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Collection } from "@/types/collection"

interface BookmarkListProps {
  bookmarks: Bookmark[]
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmarkId: string) => void
  onLikeToggle: (bookmarkId: string, isLiked: boolean) => void
  onFavoriteToggle: (bookmarkId: string, isFavorite: boolean) => void
  onPlayMedia: (bookmark: Bookmark) => void // Changed prop for playing media
  isMusicCollection?: boolean
  isPlaying: boolean;
  onNextMedia: () => void;
  onPreviousMedia: () => void;
  onPlayAllMusic: (bookmarksToPlay: Bookmark[]) => void; // New prop
  selectedCollectionId: string; // New prop to receive the selected collection ID
  collections: Collection[]; // New prop to receive all collections
}

// Removed helper function to extract YouTube video ID
// const getYouTubeVideoId = (url: string): string | null => {
//   const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/ ]{11})/;
//   const match = url.match(youtubeRegex);
//   if (match) {
//     const urlObj = new URL(url);
//     if (urlObj.hostname === 'music.youtube.com' || urlObj.hostname.endsWith('.youtube.com') || urlObj.hostname === 'youtu.be') {
//       return match[1];
//     }
//   }
//   return null;
// };

export function BookmarkList({ bookmarks, onEdit, onDelete, onLikeToggle, onFavoriteToggle, onPlayMedia, isMusicCollection, isPlaying, onNextMedia, onPreviousMedia, onPlayAllMusic, selectedCollectionId }: BookmarkListProps) {
  const handleVisit = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleDelete = (bookmarkId: string) => {
    if (confirm("Are you sure you want to delete this bookmark?")) {
      onDelete(bookmarkId)
    }
  }

  const shuffleArray = (array: any[]) => {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {

      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }

  const handlePlayAll = () => {
    const mediaBookmarks = bookmarks.filter(b => b.mediaType === "audio" || b.mediaType === "video");
    if (mediaBookmarks.length > 0) {
      const shuffledBookmarks = shuffleArray([...mediaBookmarks]); // Shuffle a copy
      onPlayAllMusic(shuffledBookmarks);
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
      const urlObj = new URL(url)
      const domain = urlObj.hostname

      // Don't request favicons for local development URLs or empty domains
      if (domain === "localhost" || domain === "127.0.0.1" || !domain) {
        return null
      }
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-2">
      {isMusicCollection && bookmarks.some(b => b.mediaType === "audio" || b.mediaType === "video") && (
        <div className="flex justify-end mb-4">
          <Button onClick={handlePlayAll} className="bg-green-500 hover:bg-green-600 text-white">
            <Play className="w-4 h-4 mr-2" /> Play All (Shuffle)
          </Button>
        </div>
      )}
      {bookmarks.map((bookmark) => {
        // Removed youtubeVideoId
        // const youtubeVideoId = getYouTubeVideoId(bookmark.url);
        return (
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
                  <Globe className="w-3 h-3 text-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate mb-1">{bookmark.title}</h3>
                <div className="flex items-center gap-2 text-sm text-foreground mb-2">
                  <span className="truncate">{getDomainFromUrl(bookmark.url)}</span>
                  <span>•</span>
                  <span>{bookmark.createdAt.toLocaleDateString()}</span>
                </div>
                {bookmark.description && (
                  <p className="text-sm text-foreground line-clamp-1 mb-2">{bookmark.description}</p>
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
              <div className="flex items-center gap-2 transition-opacity">
                {(bookmark.mediaType === "audio" || bookmark.mediaType === "video") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayMedia(bookmark);
                    }}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Play
                  </Button>
                )}
                {/* Like Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 px-3", bookmark.isLiked && "text-red-500")}
                  onClick={(e) => {
                    e.stopPropagation()
                    onLikeToggle(bookmark.id, bookmark.isLiked || false)
                  }}
                >
                  <Heart className={cn("w-4 h-4 mr-1", bookmark.isLiked && "fill-current")} />
                  {bookmark.likesCount || 0}
                </Button>

                {/* Favorite Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 px-3", bookmark.isFavorite && "text-primary")}
                  onClick={(e) => {
                    e.stopPropagation()
                    onFavoriteToggle(bookmark.id, bookmark.isFavorite || false)
                  }}
                >
                  <BookmarkIcon className={cn("w-4 h-4 mr-1", bookmark.isFavorite && "fill-current")} />
                  Save
                </Button>

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
      )})}
    </div>
  )
}
