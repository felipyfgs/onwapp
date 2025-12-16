"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { FileImage } from "lucide-react"
import { getMediaList, getMediaStreamUrl, retryDownload, type Media } from "@/lib/api/media"
import { MediaItem, type MediaFile } from "./media-item"
import { MediaFilter, type MediaType } from "./media-filter"
import { EmptyState } from "@/components/empty-state"
import { LoadingGrid } from "@/components/loading-state"
import { Input } from "@/components/ui/input"

export function MediaGallery() {
  const params = useParams()
  const sessionId = params.id as string
  
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<MediaType>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchMedia() {
      try {
        setLoading(true)
        const data = await getMediaList(sessionId)
        setMedia(data.map((m: Media) => ({
          id: m.id,
          msgId: m.msgId,
          mediaType: m.mediaType,
          mimeType: m.mimeType,
          fileName: m.fileName,
          fileSize: m.fileSize,
          downloaded: m.downloaded,
          downloadError: m.downloadError,
          storageUrl: m.storageUrl,
          thumbnailUrl: m.thumbnailUrl,
          createdAt: m.createdAt,
        })))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load media")
      } finally {
        setLoading(false)
      }
    }
    fetchMedia()
  }, [sessionId])

  const filteredMedia = useMemo(() => {
    return media.filter((m) => {
      if (filter !== "all" && m.mediaType !== filter) return false
      if (search && m.fileName && !m.fileName.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      return true
    })
  }, [media, filter, search])

  const handleDownload = (item: MediaFile) => {
    const url = getMediaStreamUrl(sessionId, item.id)
    window.open(url, "_blank")
  }

  const handleRetry = async (item: MediaFile) => {
    try {
      await retryDownload(sessionId, item.id)
      setMedia((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, downloadError: undefined } : m
        )
      )
    } catch (err) {
      console.error("Retry failed:", err)
    }
  }

  const handleView = (item: MediaFile) => {
    if (item.storageUrl) {
      window.open(item.storageUrl, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input placeholder="Search files..." className="max-w-sm" disabled />
        </div>
        <LoadingGrid count={12} />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={FileImage}
        title="Failed to load media"
        description={error}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <MediaFilter value={filter} onChange={setFilter} />
      </div>

      {filteredMedia.length === 0 ? (
        <EmptyState
          icon={FileImage}
          title="No media found"
          description={
            filter !== "all" || search
              ? "Try adjusting your filters"
              : "Media files will appear here when received"
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <MediaItem
              key={item.id}
              media={item}
              onDownload={handleDownload}
              onRetry={handleRetry}
              onView={handleView}
            />
          ))}
        </div>
      )}
    </div>
  )
}
