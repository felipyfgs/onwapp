"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface ContactSkeletonProps {
  count?: number
}

export function ContactSkeleton({ count = 8 }: ContactSkeletonProps) {
  return (
    <div className="border border-border rounded-lg divide-y divide-border">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
