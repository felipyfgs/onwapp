"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
}

export function ListSkeleton({ count = 5, showAvatar = true }: ListSkeletonProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
          {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
