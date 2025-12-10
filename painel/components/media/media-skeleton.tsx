"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface MediaSkeletonProps {
  count?: number
}

export function MediaSkeleton({ count = 10 }: MediaSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  )
}
