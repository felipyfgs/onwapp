"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, FileText } from "lucide-react"
import { MediaItem, getMediaDownloadUrl } from "@/lib/api/media"

interface MediaViewerDialogProps {
  item: MediaItem | null
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ""
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ""
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function MediaViewerDialog({
  item,
  sessionId,
  open,
  onOpenChange,
}: MediaViewerDialogProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{item.fileName || "Mídia"}</DialogTitle>
          <DialogDescription>
            {item.mediaType} · {formatFileSize(item.fileSize)}
            {item.duration && ` · ${formatDuration(item.duration)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
            {item.mediaType === "image" && item.storageUrl && (
              <img
                src={item.storageUrl}
                alt={item.fileName || "Image"}
                className="max-w-full max-h-[60vh] object-contain"
              />
            )}
            {item.mediaType === "video" && item.storageUrl && (
              <video src={item.storageUrl} controls className="max-w-full max-h-[60vh]" />
            )}
            {item.mediaType === "audio" && item.storageUrl && (
              <audio src={item.storageUrl} controls className="w-full" />
            )}
            {item.mediaType === "document" && (
              <div className="p-8 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">{item.fileName}</p>
              </div>
            )}
          </div>

          {item.caption && (
            <p className="text-sm p-3 bg-muted rounded-lg">{item.caption}</p>
          )}

          <div className="flex justify-end gap-2">
            {item.storageUrl && (
              <Button asChild>
                <a href={getMediaDownloadUrl(sessionId, item.id)} download={item.fileName}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
