import { Skeleton } from "@/components/ui/skeleton"

export function ChatsSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Search */}
      <div className="p-2 border-b">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 p-2 border-b">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      {/* Chat list */}
      <div className="flex-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50">
            <Skeleton className="size-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
