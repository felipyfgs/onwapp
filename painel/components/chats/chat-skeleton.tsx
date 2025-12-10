"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface ChatSkeletonProps {
  count?: number
}

export function ChatSkeleton({ count = 8 }: ChatSkeletonProps) {
  return (
    <div className="border border-border rounded-lg divide-y divide-border">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}
