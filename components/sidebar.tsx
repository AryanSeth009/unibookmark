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
          <h1 className="font-semibold text-sidebar-foreground">SmartBookmark.Ai</h1>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            {collections.slice(0, 3).map((collection) => {
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
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{collection.name}</span>
                  {collection.count > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {collection.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

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
              {collections.slice(3).map((collection) => {
                const Icon = collectionIcons[collection.id as keyof typeof collectionIcons] || Tag

                return (
                  <div key={collection.id}>
                    <button
                      onClick={() => onSelectCollection(collection.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left",
                        selectedCollection === collection.id
                          ? "bg-primary text-primary-foreground border border-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{collection.name}</span>
                      {collection.count > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {collection.count}
                        </span>
                      )}
                    </button>
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
