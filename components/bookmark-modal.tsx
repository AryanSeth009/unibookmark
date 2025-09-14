"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Bookmark, Collection } from "@/types/bookmark"
import { X, Plus, Globe, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void
  collections: Collection[]
  editingBookmark?: Bookmark | null
}

export function BookmarkModal({ isOpen, onClose, onSave, collections, editingBookmark }: BookmarkModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    collectionId: "",
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [urlError, setUrlError] = useState("")

  // Reset form when modal opens/closes or editing bookmark changes
  useEffect(() => {
    if (isOpen) {
      if (editingBookmark) {
        setFormData({
          title: editingBookmark.title,
          url: editingBookmark.url,
          description: editingBookmark.description || "",
          collectionId: editingBookmark.collectionId,
          tags: [...editingBookmark.tags],
        })
      } else {
        // Try to get current page info if available (browser extension context)
        const currentUrl = typeof window !== "undefined" ? window.location.href : ""
        const currentTitle = typeof document !== "undefined" ? document.title : ""

        setFormData({
          title: currentTitle,
          url: currentUrl,
          description: "",
          collectionId: collections.find((c) => c.id === "unsorted")?.id || collections[0]?.id || "",
          tags: [],
        })
      }
      setTagInput("")
      setUrlError("")
    }
  }, [isOpen, editingBookmark, collections])

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, url })
    if (url && !validateUrl(url)) {
      setUrlError("Please enter a valid URL")
    } else {
      setUrlError("")
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

  const fetchPageMetadata = async () => {
    if (!formData.url || !validateUrl(formData.url)) return

    setIsLoading(true)
    try {
      // In a real browser extension, you would use the browser APIs to fetch page metadata
      // For demo purposes, we'll simulate this with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate fetched metadata
      const domain = new URL(formData.url).hostname.replace("www.", "")
      const simulatedTitle = `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Web Page`

      if (!formData.title || formData.title === document.title) {
        setFormData((prev) => ({ ...prev, title: simulatedTitle }))
      }
    } catch (error) {
      console.error("Failed to fetch page metadata:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (!formData.title.trim() || !formData.url.trim() || !formData.collectionId) {
      return
    }

    if (!validateUrl(formData.url)) {
      setUrlError("Please enter a valid URL")
      return
    }

    const bookmarkData = {
      title: formData.title.trim(),
      url: formData.url.trim(),
      description: formData.description.trim() || undefined,
      collectionId: formData.collectionId,
      tags: formData.tags,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(formData.url).hostname}&sz=32`,
    }

    onSave(bookmarkData)
    onClose()
  }

  const isFormValid = formData.title.trim() && formData.url.trim() && formData.collectionId && !urlError

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editingBookmark ? "Edit Bookmark" : "Add New Bookmark"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Field */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">
              URL *
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(urlError && "border-destructive")}
                />
                {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchPageMetadata}
                disabled={!formData.url || !validateUrl(formData.url) || isLoading}
                className="px-3 bg-transparent"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter bookmark title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Collection Field */}
          <div className="space-y-2">
            <Label htmlFor="collection" className="text-sm font-medium">
              Collection *
            </Label>
            <Select
              value={formData.collectionId}
              onValueChange={(value) => setFormData({ ...formData, collectionId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Field */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags
            </Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tags (press Enter or comma to add)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyPress}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-3 bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Display Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {editingBookmark ? "Update Bookmark" : "Save Bookmark"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
