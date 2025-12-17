import { Loader2 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

interface LoadingStateProps {
  text?: string
  className?: string
}

export function LoadingSpinner({ text, className }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className || ""}`}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

interface LoadingListProps {
  count?: number
  className?: string
}

export function LoadingList({ count = 3, className }: LoadingListProps) {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface LoadingGridProps {
  count?: number
  className?: string
}

export function LoadingGrid({ count = 6, className }: LoadingGridProps) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className || ""}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={`space-y-4 rounded-lg border p-6 ${className || ""}`}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
