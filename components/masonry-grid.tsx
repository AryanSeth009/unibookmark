"use client"

import { useState, useEffect, useRef } from "react"
import type { Bookmark } from "@/types/bookmark"
import { BookmarkCard } from "./bookmark-card"

interface MasonryGridProps {
  bookmarks: Bookmark[]
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmarkId: string) => void
  onLikeToggle: (bookmarkId: string, isLiked: boolean) => void // New prop
  onFavoriteToggle: (bookmarkId: string, isFavorite: boolean) => void // New prop
}

export function MasonryGrid({ bookmarks, onEdit, onDelete, onLikeToggle, onFavoriteToggle }: MasonryGridProps) {
  const [columns, setColumns] = useState(4)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return
      const width = containerRef.current.offsetWidth
      if (width < 640) setColumns(1)
      else if (width < 768) setColumns(2)
      else if (width < 1024) setColumns(3)
      else if (width < 1280) setColumns(4)
      else setColumns(5)
    }

    updateColumns()
    window.addEventListener("resize", updateColumns)
    return () => window.removeEventListener("resize", updateColumns)
  }, [])

  const columnArrays = Array.from({ length: columns }, () => [] as Bookmark[])
  bookmarks.forEach((bookmark, index) => {
    columnArrays[index % columns].push(bookmark)
  })

  return (
    <div ref={containerRef} className="flex gap-4">
      {columnArrays.map((columnBookmarks, columnIndex) => (
        <div key={columnIndex} className="flex-1 space-y-4">
          {columnBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="break-inside-avoid">
              <BookmarkCard bookmark={bookmark} onEdit={onEdit} onDelete={onDelete} onLikeToggle={onLikeToggle} onFavoriteToggle={onFavoriteToggle} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
