"use client"

import { MediaItem } from "@/lib/api/media"
import { MediaCard } from "./media-card"

interface MediaGridProps {
  items: MediaItem[]
  sessionId: string
  onItemClick: (item: MediaItem) => void
}

export function MediaGrid({ items, sessionId, onItemClick }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          sessionId={sessionId}
          onClick={() => onItemClick(item)}
        />
      ))}
    </div>
  )
}
