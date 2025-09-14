import type React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

export function BookmarkCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-20 h-3" />
        </div>
        <Skeleton className="w-6 h-6 rounded" />
      </div>
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-3/4 h-4" />
      <div className="flex gap-2">
        <Skeleton className="w-12 h-5 rounded-full" />
        <Skeleton className="w-16 h-5 rounded-full" />
        <Skeleton className="w-10 h-5 rounded-full" />
      </div>
      <Skeleton className="w-24 h-3" />
    </div>
  )
}
