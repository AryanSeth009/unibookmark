"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Collection } from "@/types/bookmark";
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
  CreditCard,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mutate as swrMutate } from "swr";
import { useCollections } from "@/hooks/use-collections";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut } from "lucide-react";
import randomProfile from 'random-profile-generator';

interface SidebarProps {
  collections: Collection[];
  selectedCollection: string;
  onSelectCollection: (collectionId: string) => void;
  onAddCollection: (name: string, parentId?: string) => Promise<void>;
  onSaveForLater: () => void;
  onShowSavedForLater: () => void;
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
};

function renderCollectionIcon(
  icon: string | undefined,
  color: string | undefined,
  FallbackIcon: React.ComponentType<{ className?: string }> = Tag
) {
  const hasUrlIcon =
    icon &&
    (icon.startsWith("http://") ||
      icon.startsWith("https://") ||
      icon.endsWith(".svg"));
  if (hasUrlIcon) {
    return (
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center shadow-sm"
        style={{ backgroundColor: color || "var(--sidebar-accent)" }}
      >
        <img src={icon} alt="icon" className="w-3.5 h-3.5 flex-shrink-0" />
      </span>
    );
  }
  return <FallbackIcon className="w-4 h-4 flex-shrink-0" />;
}

export function Sidebar({
  collections,
  selectedCollection,
  onSelectCollection,
  onAddCollection,
  onSaveForLater,
  onShowSavedForLater,
}: SidebarProps) {
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(["entertainment", "ecommerce", "socials", "chats"])
  );
  const [randomUserData, setRandomUserData] = useState({
    fullName: "",
    avatar: "",
  });

  const handleAddCollection = (parentId?: string) => {
    if (newCollectionName.trim()) {
      onAddCollection(newCollectionName.trim(), parentId);
      setNewCollectionName("");
      setIsAddingCollection(false);
      setAddingToParentId(undefined);
    }
  };

  const [addingToParentId, setAddingToParentId] = useState<string | undefined>();

  const handleKeyPress = (e: React.KeyboardEvent, parentId?: string) => {
    if (e.key === "Enter") {
      handleAddCollection(parentId);
    } else if (e.key === "Escape") {
      setIsAddingCollection(false);
      setNewCollectionName("");
      setAddingToParentId(undefined);
    }
  };

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const { updateCollection, deleteCollection } = useCollections();

  const { profile, isLoading: isProfileLoading } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile?.full_name) {
      const newRandomProfile = randomProfile.profile();
      setRandomUserData({
        fullName: newRandomProfile.fullName,
        avatar: newRandomProfile.avatar,
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      router.push("/auth/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayFullName = profile?.full_name || randomUserData.fullName || "User";
  const displayAvatarUrl = profile?.avatar_url || randomUserData.avatar || "/placeholder.svg";

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : (randomUserData.fullName ? randomUserData.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "U");

  return (
    <div className=" w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2">
          {/* <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Bookmark className="w-3 h-3 text-primary-foreground" />
          </div> */}
          <h1 onClick={() => (window.location.href = "/")}
            className="cursor-pointer font-semibold text-sidebar-foreground"
          >
            Unibookmark
          </h1>
          {/* <img src="/bg_logo.png" alt="Unibookmark" className="p-2 w-full h-24" /> */}
          <ThemeToggle />
        </div>
      </div>

      <ScrollArea className="flex-1  ">
        <div className="p-4 space-y-6">
          {/* Collections Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">
                Collections
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingCollection(true)}
                className="h-6 w-6 p-0 hover:bg-sidebar-accent"
              >
                <Plus className="w-3 h-3 text-foreground" />
              </Button>
            </div>

            <div className="space-y-1">
              {collections.map((collection) => {
                const isAllBookmarks = collection.id === "all";
                const subcollections = isAllBookmarks
                  ? []
                  : collection.children || []; // Ensure All Bookmarks has no visible subcollections
                const isExpanded = expandedCollections.has(collection.id);
                const Icon =
                  (isAllBookmarks
                    ? Bookmark
                    : collectionIcons[
                        collection.id as keyof typeof collectionIcons
                      ]) || Tag;

                return (
                  <div key={collection.id} className="w-full">
                    <div className="group flex flex-col">
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            onSelectCollection(collection.id);
                            if (subcollections.length > 0) {
                              toggleCollection(collection.id);
                            }
                          }}
                          className={cn(
                            "flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left",
                            selectedCollection === collection.id
                              ? "bg-primary text-primary-foreground border border-primary/20"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          {renderCollectionIcon(
                            collection.icon,
                            collection.color,
                            Icon
                          )}
                          <span className="flex-1">{collection.name}</span>
                          {subcollections.length > 0 && (
                            <span
                              className={cn(
                                "ml-auto p-1 rounded-md hover:bg-sidebar-accent",
                                "transition-transform duration-200",
                                isExpanded ? "rotate-90" : "rotate-0"
                              )}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </span>
                          )}
                          {typeof collection.count === "number" &&
                            collection.count > 0 && (
                                <span className="text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">
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
                                const name = window.prompt(
                                  "Rename collection",
                                  collection.name
                                );
                                if (!name || name.trim() === collection.name)
                                  return;
                                try {
                                  await updateCollection(collection.id, {
                                    name: name.trim(),
                                  });
                                  await swrMutate("/api/collections");
                                } catch (e) {
                                  console.error("Rename failed", e);
                                }
                              }}
                            >
                              Rename
                            </DropdownMenuItem>
                            {!isAllBookmarks && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      `Delete collection "${collection.name}"?`
                                    )
                                  )
                                    return;
                                  try {
                                    await deleteCollection(collection.id);
                                    if (selectedCollection === collection.id)
                                      onSelectCollection("all");
                                    await swrMutate("/api/collections");
                                  } catch (e) {
                                    console.error("Delete failed", e);
                                  }
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            )}
                            {!isAllBookmarks && isExpanded && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  setAddingToParentId(collection.id);
                                  setIsAddingCollection(true);
                                  // Focus the input field after a small delay to ensure it's rendered
                                  setTimeout(() => {
                                    const input = document.querySelector(
                                      ".sidebar-input"
                                    ) as HTMLInputElement;
                                    input?.focus();
                                  }, 100);
                                }}
                              >
                                Add Subcollection
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {subcollections.length > 0 && isExpanded && (
                        <div className="relative ml-4 space-y-1 mt-1 border-l-2 border-dashed border-border/50">
                          {subcollections.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => onSelectCollection(sub.id)}
                              className={cn(
                                "w-full flex items-center gap-3 pl-5 pr-3 py-2 rounded-lg text-sm transition-all duration-200 text-left relative",
                                "before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:bg-border/50", // Horizontal line
                                selectedCollection === sub.id
                                  ? "bg-primary/10 text-primary-foreground border border-primary/20"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <span className="flex-1">{sub.name}</span>
                              {typeof sub.count === "number" && sub.count > 0 && (
                                <span className="text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {sub.count}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isAddingCollection && (
                <div className="px-3 py-2">
                  <Input
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, addingToParentId)}
                    onBlur={() => {
                      if (!newCollectionName.trim()) {
                        setIsAddingCollection(false);
                        setAddingToParentId(undefined);
                      } else {
                        handleAddCollection(addingToParentId);
                      }
                    }}
                    placeholder="New collection name"
                    className="h-8"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-foreground mb-3">
              Settings
            </h2>
            <div className="space-y-1">
              {/* <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left transition-all duration-200">
                <Tag className="w-4 h-4 flex-shrink-0" />
                <span>Tags</span>
              </button> */}
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left transition-all duration-200"
                onClick={onShowSavedForLater}
              >
                <Link className="w-4 h-4 flex-shrink-0" />
                <span>Save for later</span>
              </button>
              <a
                href="/pricing"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left transition-all duration-200"
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span>Pricing</span>
              </a>
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-2 border-t flex items-center justify-between border-sidebar-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="w-full flex items-center gap-3 px-3 py-2 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={displayAvatarUrl} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 gap-2 text-left flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    {displayFullName}
                  </p>
                  <p className="text-xs text-foreground truncate">
                    Free
                  </p>
                </div>
                {/* <Button variant="secondary" size="sm" className="h-7 rounded-2xl text-xs">
                  Upgrade
                </Button> */}
              </div>
              <ChevronDown className="w-4 h-4 text-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={10} className="w-56 z-50 bg-white dark:bg-popover text-gray-900 dark:text-popover-foreground border-gray-200 dark:border-border">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={displayAvatarUrl} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium truncate">{displayFullName}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-border"/>
            <DropdownMenuItem onClick={() => router.push("/pricing")} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-accent focus:bg-gray-100 dark:focus:bg-accent">
              <User  className="w-4 h-4" />
              Upgrade plan
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center justify-start gap-2    hover:bg-gray-100 dark:hover:bg-accent focus:bg-gray-100 dark:focus:bg-accent">
              <ThemeToggle  />
            Theme toggle
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-accent focus:bg-gray-100 dark:focus:bg-accent">
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-accent focus:bg-gray-100 dark:focus:bg-accent">
              <User className="w-4 h-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-border"/>
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive flex items-center gap-2 hover:bg-red-50 dark:hover:bg-destructive/10 focus:bg-red-50 dark:focus:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
