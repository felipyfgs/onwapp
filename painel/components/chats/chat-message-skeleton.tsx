"use client"

export function ChatMessageSkeleton() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto py-4">
      {/* Date separator */}
      <div className="flex justify-center">
        <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
      </div>

      {/* Received messages */}
      <div className="flex justify-start">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="flex justify-start">
        <div className="h-14 w-64 bg-muted animate-pulse rounded-lg" />
      </div>

      {/* Sent messages */}
      <div className="flex justify-end">
        <div className="h-10 w-40 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="flex justify-end">
        <div className="h-12 w-56 bg-muted animate-pulse rounded-lg" />
      </div>

      {/* More messages */}
      <div className="flex justify-start">
        <div className="h-16 w-52 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="flex justify-end">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
