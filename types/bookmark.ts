export interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  collectionId: string
  tags: string[]
  createdAt: Date
  favicon?: string
  thumbnailUrl?: string
  language?: string
  mediaType?: "audio" | "video" | "other"
  isFavorite?: boolean
  likesCount?: number
  isLiked?: boolean
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  count?: number;
  children?: Collection[];
}

export type ViewMode = "grid" | "list" | "masonry"
export type DateFilter = "all" | "today" | "week" | "month"
