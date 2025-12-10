"use client"

import { useEffect, useState, useCallback, use, useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  MediaGrid,
  MediaFilters,
  MediaEmptyState,
  MediaSkeleton,
  MediaViewerDialog,
  type MediaFilterType,
} from "@/components/media"
import { MediaItem, getMediaList } from "@/lib/api/media"

interface MediaPageProps {
  params: Promise<{ id: string }>
}

export default function MediaPage({ params }: MediaPageProps) {
  const { id } = use(params)

  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<MediaFilterType>("all")
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

  const fetchMedia = useCallback(async () => {
    try {
      const data = await getMediaList(id, {
        mediaType: filter === "all" ? undefined : filter,
        limit: 100,
      })
      setMedia(data.media || [])
    } catch (error) {
      console.error("Failed to fetch media:", error)
      setMedia([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id, filter])

  useEffect(() => {
    setLoading(true)
    fetchMedia()
  }, [fetchMedia])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchMedia()
  }

  const stats = useMemo(() => {
    const counts: Record<string, number> = { all: media.length }
    media.forEach((item) => {
      const type = item.mediaType || "document"
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [media])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Mídia</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <MediaFilters
          filter={filter}
          onFilterChange={setFilter}
          stats={stats}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        {loading ? (
          <MediaSkeleton />
        ) : media.length === 0 ? (
          <MediaEmptyState />
        ) : (
          <MediaGrid items={media} sessionId={id} onItemClick={setSelectedMedia} />
        )}
      </div>

      <MediaViewerDialog
        item={selectedMedia}
        sessionId={id}
        open={!!selectedMedia}
        onOpenChange={(open) => !open && setSelectedMedia(null)}
      />
    </>
  )
}
