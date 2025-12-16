"use client"

import { Download, Eye, File, FileAudio, FileImage, FileVideo, MoreHorizontal, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatFileSize } from "@/lib/api/media"

export interface MediaFile {
  id: string
  msgId: string
  mediaType: "image" | "video" | "audio" | "document"
  mimeType: string
  fileName?: string
  fileSize: number
  downloaded: boolean
  downloadError?: string
  storageUrl?: string
  thumbnailUrl?: string
  createdAt: string
}

interface MediaItemProps {
  media: MediaFile
  onDownload?: (media: MediaFile) => void
  onRetry?: (media: MediaFile) => void
  onView?: (media: MediaFile) => void
}

const mediaIcons = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: File,
}

export function MediaItem({ media, onDownload, onRetry, onView }: MediaItemProps) {
  const Icon = mediaIcons[media.mediaType] || File

  return (
    <div className="group relative rounded-lg border overflow-hidden bg-card hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {media.thumbnailUrl ? (
          <img
            src={media.thumbnailUrl}
            alt={media.fileName || "Media"}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="h-12 w-12 text-muted-foreground" />
        )}
        
        {!media.downloaded && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            {media.downloadError ? (
              <Badge variant="destructive" className="text-xs">
                Failed
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Pending
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-sm font-medium truncate">
          {media.fileName || `${media.mediaType}-${media.id.slice(0, 8)}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(media.fileSize)}
        </p>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {media.downloaded && (
              <>
                <DropdownMenuItem onClick={() => onView?.(media)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload?.(media)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              </>
            )}
            {!media.downloaded && (
              <DropdownMenuItem onClick={() => onRetry?.(media)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Download
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
