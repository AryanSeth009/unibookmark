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
import type { Bookmark } from "@/types/bookmark"
import { X, Plus, Globe, Loader2, Folder, Tag as TagIcon, Image as ImageIcon, FileText, AlignLeft } from "lucide-react" // Added Folder and TagIcon
import { cn } from "@/lib/utils"
import { extractThumbnailForUrl } from "@/hooks/use-thumbnail"
import { Collection } from "@/hooks/use-collections"

interface BookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void
  collections: Collection[]
  editingBookmark?: Bookmark | null
  onAddCollection: (name: string, parentId?: string) => Promise<void>; // New prop for adding collections
}

export function BookmarkModal({ isOpen, onClose, onSave, collections, editingBookmark, onAddCollection }: BookmarkModalProps) {
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState(false)
  const [isAddingCollectionLocal, setIsAddingCollectionLocal] = useState(false); // Local state for adding collection
  const [newCollectionNameLocal, setNewCollectionNameLocal] = useState(""); // Local state for new collection name

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
          collectionId: collections.length > 0 ? (collections.find((c) => c.id === "unsorted")?.id || collections[0]?.id) : "",
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

  const handleUrlChange = async (url: string) => {
    setFormData({ ...formData, url })
    if (url && !validateUrl(url)) {
      setUrlError("Please enter a valid URL")
    } else {
      setUrlError("")
      
      // Extract thumbnail when URL changes
      if (url && validateUrl(url)) {
        setIsExtractingThumbnail(true)
        try {
          const thumbnail = await extractThumbnailForUrl(url)
          setThumbnailUrl(thumbnail)
        } catch (error) {
          console.error("Failed to extract thumbnail:", error)
          setThumbnailUrl(null)
        } finally {
          setIsExtractingThumbnail(false)
        }
      } else {
        setThumbnailUrl(null)
      }
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
      thumbnailUrl: thumbnailUrl || undefined,
    }

    onSave(bookmarkData)
    onClose()
  }

  const isFormValid = formData.title.trim() && formData.url.trim() && formData.collectionId && !urlError

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] h-full flex flex-col bg-card border-border p-0 overflow-hidden n8n-3d-container">
        <DialogHeader className="p-6 border-b border-border/50 bg-card/80 backdrop-blur-sm n8n-glass n8n-3d-bg">
          <DialogTitle className="text-foreground text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {editingBookmark ? "Edit Bookmark" : "Add New Bookmark"}
          </DialogTitle>
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full w-8 h-8 text-foreground hover:bg-muted/50 n8n-interactive-3d"
          >
           <X className="w-4 h-4" /> 
          </Button> */}
        </DialogHeader>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* URL Field */}
          <div className="space-y-2 relative">
            <Label htmlFor="url" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <Globe className="w-4 h-4 text-muted-foreground" />
              URL *
            </Label>
            <div className="flex gap-2 relative">
              <Input
                id="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={cn("pr-10 n8n-glass", urlError && "border-destructive")} // Add pr-10 for button
              />
              {isExtractingThumbnail && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
              )}
              {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={fetchPageMetadata}
              disabled={!formData.url || !validateUrl(formData.url) || isLoading || isExtractingThumbnail}
              className="w-full mt-2 bg-background/50 hover:bg-background/80 border border-border/50 text-foreground n8n-interactive-3d"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              Fetch Page Metadata
            </Button>
          </div>

          {/* Thumbnail Preview */}
          {(thumbnailUrl || isExtractingThumbnail) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                Thumbnail Preview
              </Label>
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border/50 bg-muted/20 flex items-center justify-center">
                {isExtractingThumbnail ? (
                  <div className="flex flex-col items-center justify-center h-full bg-muted/50">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Extracting thumbnail...</span>
                  </div>
                ) : thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={() => setThumbnailUrl(null)}
                  />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span>No thumbnail available</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter bookmark title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="n8n-glass"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <AlignLeft className="w-4 h-4 text-muted-foreground" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="resize-none n8n-glass"
            />
          </div>

          {/* Collection Field */}
          <div className="space-y-2">
            <Label htmlFor="collection" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <Folder className="w-4 h-4 text-muted-foreground" />
              Collection *
            </Label>
            <div className="flex items-center gap-2">
              <Select
                value={formData.collectionId}
                onValueChange={(value) => setFormData({ ...formData, collectionId: value })}
              >
                <SelectTrigger className="flex-1 n8n-glass">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent className="n8n-glass">
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      <span className={cn(collection.parentId && "ml-4 text-muted-foreground")}>
                        {collection.parentId ? "↳ " : ""}{collection.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddingCollectionLocal(!isAddingCollectionLocal)}
                className="px-3 bg-background/50 hover:bg-background/80 border border-border/50 text-foreground n8n-interactive-3d"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {isAddingCollectionLocal && (
              <div className="space-y-2 mt-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                <Input
                  placeholder="New collection name"
                  value={newCollectionNameLocal}
                  onChange={(e) => setNewCollectionNameLocal(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && newCollectionNameLocal.trim()) {
                      e.preventDefault();
                      // Decide whether to add as root or subcollection based on current selection
                      if (formData.collectionId) {
                        await onAddCollection(newCollectionNameLocal.trim(), formData.collectionId); // Add as subcollection
                      } else {
                        await onAddCollection(newCollectionNameLocal.trim(), undefined); // Add as root collection
                      }
                      setNewCollectionNameLocal("");
                      setIsAddingCollectionLocal(false);
                    }
                  }}
                  autoFocus
                  className="n8n-glass"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (newCollectionNameLocal.trim()) {
                        await onAddCollection(newCollectionNameLocal.trim(), undefined); // Add as root collection
                        setNewCollectionNameLocal("");
                        setIsAddingCollectionLocal(false);
                      }
                    }}
                    disabled={!newCollectionNameLocal.trim()}
                    className="flex-1 bg-background/50 hover:bg-background/80 border border-border/50 text-foreground n8n-interactive-3d"
                  >
                    Add Root Collection
                  </Button>
                  <Button
                    onClick={async () => {
                      if (newCollectionNameLocal.trim()) {
                        await onAddCollection(newCollectionNameLocal.trim(), formData.collectionId); // Add as subcollection
                        setNewCollectionNameLocal("");
                        setIsAddingCollectionLocal(false);
                      }
                    }}
                    disabled={!newCollectionNameLocal.trim() || !formData.collectionId}
                    className="flex-1 bg-background/50 hover:bg-background/80 border border-border/50 text-foreground n8n-interactive-3d"
                  >
                    Add Subcollection
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tags Field */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <TagIcon className="w-4 h-4 text-muted-foreground" />
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
                  className="flex-1 n8n-glass"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-3 bg-background/50 hover:bg-background/80 border border-border/50 text-foreground n8n-interactive-3d"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Display Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-normal bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
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

        <DialogFooter className="p-6 flex justify-end gap-3 border-t border-border/50 bg-card/80 backdrop-blur-sm n8n-glass n8n-3d-bg">
          <Button variant="outline" onClick={onClose} className="min-w-[100px] bg-transparent border-border/50 hover:bg-muted/50 text-foreground n8n-interactive-3d">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isLoading || isExtractingThumbnail}
            className="min-w-[100px] bg-primary hover:bg-primary/90 text-primary-foreground n8n-interactive-3d n8n-glow"
          >
            {editingBookmark ? "Update Bookmark" : "Save Bookmark"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
