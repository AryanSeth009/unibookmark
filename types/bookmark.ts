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
}

export interface Collection {
  id: string
  name: string
  count: number
  isDefault: boolean
  icon?: string
  color?: string
  description?: string
}

export type ViewMode = "grid" | "list" | "masonry"
export type DateFilter = "all" | "today" | "week" | "month"
