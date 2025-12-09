import { Skeleton } from "@/components/ui/skeleton"

export function ChatsSkeleton() {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden animate-in fade-in-0 duration-300">
      {/* Chat list sidebar */}
      <div className="w-full md:w-[400px] md:min-w-[340px] md:max-w-[500px] flex flex-col border-r bg-card overflow-hidden">
        {/* Search */}
        <div className="px-3 py-2">
          <Skeleton className="h-[35px] w-full rounded-lg animate-pulse" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-3 py-1.5 border-b">
          <Skeleton className="h-7 w-16 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <Skeleton className="h-7 w-20 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
          <Skeleton className="h-7 w-16 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <Skeleton className="h-7 w-20 rounded-full animate-pulse" style={{ animationDelay: '225ms' }} />
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 animate-in fade-in-0 slide-in-from-left-2 duration-300"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
            >
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
      <div className="hidden md:flex flex-1 flex-col min-h-0 overflow-hidden bg-gradient-to-br from-background via-muted/5 to-background">
        {/* Chat header skeleton */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card/50 backdrop-blur-sm animate-in fade-in-0 duration-300">
          <Skeleton className="size-10 rounded-full animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32 animate-pulse" style={{ animationDelay: '100ms' }} />
            <Skeleton className="h-3 w-24 animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <Skeleton className="size-9 rounded-full animate-pulse" style={{ animationDelay: '225ms' }} />
            <Skeleton className="size-9 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Messages area skeleton */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          {/* Received message */}
          <div className="flex justify-start animate-in slide-in-from-left-3 fade-in-0 duration-300" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <Skeleton className="h-12 w-48 rounded-lg rounded-tl-none" />
          </div>
          {/* Sent message */}
          <div className="flex justify-end animate-in slide-in-from-right-3 fade-in-0 duration-300" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            <Skeleton className="h-10 w-36 rounded-lg rounded-tr-none" />
          </div>
          {/* Received message */}
          <div className="flex justify-start animate-in slide-in-from-left-3 fade-in-0 duration-300" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            <Skeleton className="h-32 w-56 rounded-lg rounded-tl-none" />
          </div>
          {/* Sent message */}
          <div className="flex justify-end animate-in slide-in-from-right-3 fade-in-0 duration-300" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            <Skeleton className="h-16 w-52 rounded-lg rounded-tr-none" />
          </div>
          {/* Received message */}
          <div className="flex justify-start animate-in slide-in-from-left-3 fade-in-0 duration-300" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <Skeleton className="h-10 w-40 rounded-lg rounded-tl-none" />
          </div>
          {/* Sent message */}
          <div className="flex justify-end animate-in slide-in-from-right-3 fade-in-0 duration-300" style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}>
            <Skeleton className="h-12 w-44 rounded-lg rounded-tr-none" />
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="flex items-center gap-2 p-3 border-t bg-card/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}>
          <Skeleton className="size-9 rounded-full animate-pulse" />
          <Skeleton className="size-9 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
          <Skeleton className="flex-1 h-11 rounded-lg animate-pulse" style={{ animationDelay: '150ms' }} />
          <Skeleton className="size-10 rounded-full animate-pulse" style={{ animationDelay: '225ms' }} />
        </div>
      </div>
    </div>
  )
}
