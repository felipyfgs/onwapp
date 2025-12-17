"use client"

import { File, FileAudio, FileImage, FileVideo, LayoutGrid } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type MediaType = "all" | "image" | "video" | "audio" | "document"

interface MediaFilterProps {
  value: MediaType
  onChange: (value: MediaType) => void
}

const filters: { value: MediaType; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "image", label: "Images", icon: FileImage },
  { value: "video", label: "Videos", icon: FileVideo },
  { value: "audio", label: "Audio", icon: FileAudio },
  { value: "document", label: "Documents", icon: File },
]

export function MediaFilter({ value, onChange }: MediaFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as MediaType)}
      className="justify-start"
    >
      {filters.map((filter) => (
        <ToggleGroupItem
          key={filter.value}
          value={filter.value}
          aria-label={filter.label}
          className="gap-2"
        >
          <filter.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{filter.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
