"use client"

import { useRef } from "react"
import { Paperclip, Image, FileText, Camera, Mic, MapPin, Contact2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type AttachmentType = "image" | "video" | "document" | "audio" | "location" | "contact" | "camera"

interface AttachmentMenuProps {
  onSelect: (type: AttachmentType, file?: File) => void
  disabled?: boolean
}

const attachmentOptions = [
  { type: "document" as const, icon: FileText, label: "Documento", color: "bg-purple-500", accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" },
  { type: "camera" as const, icon: Camera, label: "Camera", color: "bg-pink-500", accept: "image/*" },
  { type: "image" as const, icon: Image, label: "Fotos e Videos", color: "bg-blue-500", accept: "image/*,video/*" },
  { type: "audio" as const, icon: Mic, label: "Audio", color: "bg-orange-500", accept: "audio/*" },
  { type: "location" as const, icon: MapPin, label: "Localizacao", color: "bg-green-500", accept: "" },
  { type: "contact" as const, icon: Contact2, label: "Contato", color: "bg-sky-600", accept: "" },
]

export function AttachmentMenu({ onSelect, disabled }: AttachmentMenuProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleClick = (type: AttachmentType, accept: string) => {
    if (accept && fileInputRefs.current[type]) {
      fileInputRefs.current[type]?.click()
    } else {
      onSelect(type)
    }
  }

  const handleFileChange = (type: AttachmentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onSelect(type, file)
    }
    e.target.value = ""
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Paperclip className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="w-auto p-4 border shadow-xl"
        sideOffset={10}
      >
        <div className="grid grid-cols-3 gap-4">
          {attachmentOptions.map(({ type, icon: Icon, label, color, accept }) => (
            <div key={type} className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleClick(type, accept)}
                className={cn(
                  "size-12 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110",
                  color
                )}
              >
                <Icon className="size-5" />
              </button>
              <span className="text-xs text-muted-foreground">{label}</span>
              {accept && (
                <input
                  ref={(el) => { fileInputRefs.current[type] = el }}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={(e) => handleFileChange(type, e)}
                />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
