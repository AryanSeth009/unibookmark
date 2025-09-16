"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Collection } from "@/types/bookmark"
import {
  Bookmark,
  Plus,
  Pin,
  Shield,
  Tv,
  Music,
  ShoppingCart,
  Users,
  MessageCircle,
  Hash,
  Tag,
  Link,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { UserProfileSection } from "@/components/user-profile-section"
import { mutate as swrMutate } from "swr"
import { updateCollection, deleteCollection } from "@/hooks/use-collections"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface SidebarProps {
  collections: Collection[]
  selectedCollection: string
  onSelectCollection: (collectionId: string) => void
  onAddCollection: (name: string) => void
}

const collectionIcons = {
  all: Bookmark,
  pinned: Pin,
  safe: Shield,
  entertainment: Tv,
  music: Music,
  ecommerce: ShoppingCart,
  socials: Users,
  chats: MessageCircle,
  reddit: Hash,
  jam: Music,
}

function renderCollectionIcon(
  icon: string | undefined,
  color: string | undefined,
  FallbackIcon: React.ComponentType<{ className?: string }> = Tag,
) {
  const hasUrlIcon = icon && (icon.startsWith("http://") || icon.startsWith("https://") || icon.endsWith(".svg"))
  if (hasUrlIcon) {
    return (
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center shadow-sm"
        style={{ backgroundColor: color || "var(--sidebar-accent)" }}
      >
        <img src={icon} alt="icon" className="w-3.5 h-3.5 flex-shrink-0" />
      </span>
    )
  }
  return <FallbackIcon className="w-4 h-4 flex-shrink-0" />
}

export function Sidebar({ collections, selectedCollection, onSelectCollection, onAddCollection }: SidebarProps) {
  const [isAddingCollection, setIsAddingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(["entertainment", "ecommerce", "socials", "chats"]),
  )

  const handleAddCollection = () => {
    if (newCollectionName.trim()) {
      onAddCollection(newCollectionName.trim())
      setNewCollectionName("")
      setIsAddingCollection(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCollection()
    } else if (e.key === "Escape") {
      setIsAddingCollection(false)
      setNewCollectionName("")
    }
  }

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections)
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId)
    } else {
      newExpanded.add(collectionId)
    }
    setExpandedCollections(newExpanded)
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Bookmark className="w-3 h-3 text-primary-foreground" />
          </div>
          <h1 className="font-semibold text-sidebar-foreground">Unibookmark.Ai</h1>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* All Bookmarks Section */}
          <div className="space-y-1">
            {collections
              .filter((col) => col.id === "all")
              .map((collection) => {
                const Icon = Bookmark
                return (
                  <button
                    key={collection.id}
                    onClick={() => onSelectCollection(collection.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left",
                      selectedCollection === collection.id
                        ? "bg-primary text-primary-foreground border border-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {renderCollectionIcon(collection.icon, collection.color, Icon)}
                    <span className="flex-1">{collection.name}</span>
                    {typeof collection.count === "number" && collection.count > 0 && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {collection.count}
                      </span>
                    )}
                  </button>
                )
              })}
          </div>

          {/* Collections Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted-foreground">Collections</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingCollection(true)}
                className="h-6 w-6 p-0 hover:bg-sidebar-accent"
              >
                <Plus className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>

            <div className="space-y-1">
              {collections
                .filter((col) => col.id !== "all")
                .map((collection) => {
                  const Icon = collectionIcons[collection.id as keyof typeof collectionIcons] || Tag

                  return (
                    <div key={collection.id} className="group flex items-center">
                      <button
                        onClick={() => onSelectCollection(collection.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left",
                          selectedCollection === collection.id
                            ? "bg-primary text-primary-foreground border border-primary/20"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        {renderCollectionIcon(collection.icon, collection.color, Icon)}
                        <span className="flex-1">{collection.name}</span>
                        {typeof collection.count === "number" && collection.count > 0 && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {collection.count}
                          </span>
                        )}
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label="Collection actions"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-sidebar-accent ml-1 mr-1"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={async () => {
                              const name = window.prompt("Rename collection", collection.name)
                              if (!name || name.trim() === collection.name) return
                              try {
                                await updateCollection(collection.id, { name: name.trim() })
                                await swrMutate("/api/collections")
                              } catch (e) {
                                console.error("Rename failed", e)
                              }
                            }}
                          >
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async () => {
                              if (!window.confirm(`Delete collection "${collection.name}"?`)) return
                              try {
                                await deleteCollection(collection.id)
                                if (selectedCollection === collection.id) onSelectCollection("all")
                                await swrMutate("/api/collections")
                              } catch (e) {
                                console.error("Delete failed", e)
                              }
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}

              {isAddingCollection && (
                <div className="px-3 py-2">
                  <Input
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={() => {
                      if (!newCollectionName.trim()) {
                        setIsAddingCollection(false)
                      }
                    }}
                    placeholder="Collection name"
                    className="h-8 text-sm bg-input border-border"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Settings</h2>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left transition-all duration-200">
                <Tag className="w-4 h-4 flex-shrink-0" />
                <span>Tags</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left transition-all duration-200">
                <Link className="w-4 h-4 flex-shrink-0" />
                <span>Broken Links</span>
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>

      <UserProfileSection />
    </div>
  )
}
