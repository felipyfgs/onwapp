"use client"

import { Image as ImageIcon, Video, Music, FileText, Play } from "lucide-react"
import { MediaItem } from "@/lib/api/media"

interface MediaCardProps {
  item: MediaItem
  sessionId: string
  onClick: () => void
}

function getMediaTypeIcon(type?: string) {
  switch (type) {
    case "image":
      return <ImageIcon className="h-8 w-8 text-muted-foreground" />
    case "video":
      return <Video className="h-8 w-8 text-muted-foreground" />
    case "audio":
      return <Music className="h-8 w-8 text-muted-foreground" />
    default:
      return <FileText className="h-8 w-8 text-muted-foreground" />
  }
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const renderPreview = () => {
    if (item.mediaType === "image" && item.storageUrl) {
      return (
        <img
          src={item.storageUrl}
          alt={item.fileName || "Image"}
          className="w-full h-full object-cover"
        />
      )
    }

    if (item.mediaType === "video" && item.storageUrl) {
      return (
        <div className="relative w-full h-full bg-muted flex items-center justify-center">
          <Play className="h-10 w-10 text-muted-foreground" />
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        {getMediaTypeIcon(item.mediaType)}
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
    >
      {renderPreview()}
    </button>
  )
}
