"use client"

import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Video, FileText, Music, RefreshCw, File } from "lucide-react"

export type MediaFilterType = "all" | "image" | "video" | "audio" | "document"

const filterConfig: Record<MediaFilterType, { label: string; icon: React.ReactNode }> = {
  all: { label: "Todos", icon: <File className="h-4 w-4" /> },
  image: { label: "Imagens", icon: <ImageIcon className="h-4 w-4" /> },
  video: { label: "Vídeos", icon: <Video className="h-4 w-4" /> },
  audio: { label: "Áudios", icon: <Music className="h-4 w-4" /> },
  document: { label: "Documentos", icon: <FileText className="h-4 w-4" /> },
}

interface MediaFiltersProps {
  filter: MediaFilterType
  onFilterChange: (filter: MediaFilterType) => void
  stats: Record<string, number>
  onRefresh: () => void
  refreshing: boolean
}

export function MediaFilters({
  filter,
  onFilterChange,
  stats,
  onRefresh,
  refreshing,
}: MediaFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(filterConfig) as MediaFilterType[]).map((key) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(key)}
          >
            {filterConfig[key].icon}
            <span className="ml-1.5">
              {filterConfig[key].label}
              {stats[key] !== undefined && ` (${stats[key]})`}
            </span>
          </Button>
        ))}
      </div>

      <Button variant="outline" size="icon" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}
