import { Skeleton } from "@/components/ui/skeleton"

export function ChatsSkeleton() {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Chat list sidebar */}
      <div className="w-full md:w-[400px] md:min-w-[340px] md:max-w-[500px] flex flex-col border-r bg-card overflow-hidden">
        {/* Search */}
        <div className="px-3 py-2">
          <Skeleton className="h-[35px] w-full rounded-lg" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-3 py-1.5 border-b">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50">
              <Skeleton className="size-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-44" />
                  {i % 3 === 0 && <Skeleton className="h-5 w-5 rounded-full" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area placeholder */}
      <div className="hidden md:flex flex-1 flex-col min-h-0 overflow-hidden bg-muted/10">
        {/* Chat header skeleton */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>

        {/* Messages area skeleton */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          {/* Received message */}
          <div className="flex justify-start">
            <Skeleton className="h-12 w-48 rounded-lg rounded-tl-none" />
          </div>
          {/* Sent message */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-36 rounded-lg rounded-tr-none" />
          </div>
          {/* Received message */}
          <div className="flex justify-start">
            <Skeleton className="h-32 w-56 rounded-lg rounded-tl-none" />
          </div>
          {/* Sent message */}
          <div className="flex justify-end">
            <Skeleton className="h-16 w-52 rounded-lg rounded-tr-none" />
          </div>
          {/* Received message */}
          <div className="flex justify-start">
            <Skeleton className="h-10 w-40 rounded-lg rounded-tl-none" />
          </div>
          {/* Sent message */}
          <div className="flex justify-end">
            <Skeleton className="h-12 w-44 rounded-lg rounded-tr-none" />
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="flex items-center gap-2 p-3 border-t bg-card">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="flex-1 h-11 rounded-lg" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
    </div>
  )
}
