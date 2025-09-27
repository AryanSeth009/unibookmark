"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Bookmark, Collection } from "@/types/bookmark"
import { X, Plus, Check, Globe, Tag, Folder, Sparkles, Loader2 } from "lucide-react" // Added Loader2
import { cn } from "@/lib/utils"
import { motion } from "framer-motion" // Added motion

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
      <div className={cn("w-full max-w-md mx-auto p-6 bg-card border border-border rounded-xl shadow-lg n8n-3d-container n8n-glow-accent", className)}>
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center n8n-depth-2"
          >
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-foreground bg-gradient-to-r from-green-500 to-teal-400 bg-clip-text text-transparent">Bookmark Saved!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Added to <span className="font-medium text-primary">{collections.find((c) => c.id === formData.collectionId)?.name}</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "w-full max-w-md mx-auto p-6 bg-card border border-border rounded-xl shadow-lg space-y-4 n8n-3d-card",
        className,
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center n8n-depth-2">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Quick Save</h2>
            <p className="text-xs text-muted-foreground">Save this page to your bookmarks effortlessly</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full n8n-interactive-3d">
            <X className="w-4 h-4 text-foreground" />
          </Button>
        )}
      </div>

      {/* URL Preview */}
      <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border border-border/50 n8n-glass">
        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-foreground truncate font-mono">{formData.url}</span>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <Input
          placeholder="Page title (automatically fetched)"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-sm text-foreground placeholder:text-muted-foreground n8n-glass"
        />
      </div>

      {/* Collection Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Folder className="w-4 h-4 text-muted-foreground" />
          <span>Save to collection</span>
        </div>
        <Select
          value={formData.collectionId}
          onValueChange={(value) => setFormData({ ...formData, collectionId: value })}
        >
          <SelectTrigger className="h-10 text-sm text-foreground n8n-glass">
            <SelectValue placeholder="Choose collection" className="text-muted-foreground" />
          </SelectTrigger>
          <SelectContent className="n8n-glass">
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id} className="text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                  {collection.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span>Add tags (optional)</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Type and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyPress}
            className="flex-1 h-10 text-sm text-foreground placeholder:text-muted-foreground n8n-glass"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
            className="h-10 w-10 p-0 bg-background/50 hover:bg-background/80 border border-border/50 text-foreground n8n-interactive-3d"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Display Tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2.5 py-1.5 flex items-center gap-1 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive text-muted-foreground transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-sm bg-transparent border-border/50 hover:bg-muted/50 text-foreground n8n-interactive-3d" disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleQuickSave}
          disabled={!isFormValid || isSaving}
          className="flex-1 h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground n8n-interactive-3d n8n-glow"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Save Bookmark
            </div>
          )}
        </Button>
      </div>
    </motion.div>
  )
}
