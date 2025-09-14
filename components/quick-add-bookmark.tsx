"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Bookmark, Collection } from "@/types/bookmark"
import { X, Plus, Check, Globe, Tag, Folder, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickAddBookmarkProps {
  onSave: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void
  collections: Collection[]
  onClose?: () => void
  className?: string
}

export function QuickAddBookmark({ onSave, collections, onClose, className }: QuickAddBookmarkProps) {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    collectionId: "",
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Auto-fill current page data on mount
  useEffect(() => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "https://example.com"
    const currentTitle = typeof document !== "undefined" ? document.title : "New Bookmark"
    const defaultCollection = collections.find((c) => c.id === "unsorted") || collections[0]

    setFormData({
      title: currentTitle || "New Bookmark",
      url: currentUrl,
      collectionId: defaultCollection?.id || "",
      tags: [],
    })
  }, [collections])

  const handleQuickSave = async () => {
    if (!formData.title.trim() || !formData.url.trim() || !formData.collectionId) return

    setIsSaving(true)

    try {
      const bookmarkData = {
        title: formData.title.trim(),
        url: formData.url.trim(),
        description: undefined,
        collectionId: formData.collectionId,
        tags: formData.tags,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(formData.url).hostname}&sz=32`,
      }

      onSave(bookmarkData)

      // Show success state
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onClose?.()
      }, 1500)
    } catch (error) {
      console.error("Failed to save bookmark:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((tag) => tag !== tagToRemove) })
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const isFormValid = formData.title.trim() && formData.url.trim() && formData.collectionId

  if (showSuccess) {
    return (
      <div className={cn("w-full max-w-md mx-auto p-6 bg-card border border-border rounded-xl shadow-lg", className)}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Bookmark Saved!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Added to {collections.find((c) => c.id === formData.collectionId)?.name}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto p-6 bg-card border border-border rounded-xl shadow-lg space-y-4",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quick Save</h2>
            <p className="text-xs text-muted-foreground">Save this page to your bookmarks</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* URL Preview */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-muted-foreground truncate">{formData.url}</span>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <Input
          placeholder="Page title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-sm"
        />
      </div>

      {/* Collection Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Folder className="w-3 h-3" />
          <span>Save to collection</span>
        </div>
        <Select
          value={formData.collectionId}
          onValueChange={(value) => setFormData({ ...formData, collectionId: value })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Choose collection" />
          </SelectTrigger>
          <SelectContent>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/60" />
                  {collection.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Tag className="w-3 h-3" />
          <span>Add tags (optional)</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Type and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyPress}
            className="flex-1 h-8 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
            className="h-8 w-8 p-0 bg-transparent"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Display Tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex-1 h-9 text-sm bg-transparent" disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleQuickSave}
          disabled={!isFormValid || isSaving}
          className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              Save Bookmark
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
