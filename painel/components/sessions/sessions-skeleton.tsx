import { Skeleton } from "@/components/ui/skeleton"

export function SessionsSkeleton() {
  return (
    <div className="px-5 py-4">
      {/* Header skeleton */}
      <div className="mb-4">
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Filters and New Session button skeleton */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Search bar skeleton */}
      <div className="mb-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Session list skeleton */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 ${
              i < 5 ? 'border-b' : ''
            }`}
          >
            {/* Avatar with status indicator */}
            <div className="relative shrink-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full" />
            </div>

            {/* Session info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>

            {/* Stats (desktop) */}
            <div className="hidden sm:flex gap-3 shrink-0">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
