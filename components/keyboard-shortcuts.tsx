"use client"

import { useEffect } from "react"

interface KeyboardShortcutsProps {
  onAddBookmark: () => void
  onSearch: () => void
  onToggleView: () => void
}

export function KeyboardShortcuts({ onAddBookmark, onSearch, onToggleView }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        onSearch()
      }

      // Cmd/Ctrl + N for new bookmark
      if ((event.metaKey || event.ctrlKey) && event.key === "n") {
        event.preventDefault()
        onAddBookmark()
      }

      // Cmd/Ctrl + Shift + V for toggle view
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "V") {
        event.preventDefault()
        onToggleView()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onAddBookmark, onSearch, onToggleView])

  return null
}
