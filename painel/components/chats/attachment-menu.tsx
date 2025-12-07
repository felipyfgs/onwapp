"use client"

import { useRef, useState } from "react"
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
  onSelect: (type: AttachmentType, files?: File[]) => void
  disabled?: boolean
}

const attachmentOptions = [
  { type: "document" as const, icon: FileText, label: "Documento", color: "bg-purple-500", accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt", multiple: true },
  { type: "camera" as const, icon: Camera, label: "Camera", color: "bg-pink-500", accept: "image/*", multiple: false },
  { type: "image" as const, icon: Image, label: "Fotos e Videos", color: "bg-blue-500", accept: "image/*,video/*", multiple: true },
  { type: "audio" as const, icon: Mic, label: "Audio", color: "bg-orange-500", accept: "audio/*", multiple: true },
  { type: "location" as const, icon: MapPin, label: "Localizacao", color: "bg-green-500", accept: "", multiple: false },
  { type: "contact" as const, icon: Contact2, label: "Contato", color: "bg-sky-600", accept: "", multiple: false },
]

export function AttachmentMenu({ onSelect, disabled }: AttachmentMenuProps) {
  const [open, setOpen] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleClick = (type: AttachmentType, accept: string) => {
    if (accept && fileInputRefs.current[type]) {
      fileInputRefs.current[type]?.click()
    } else {
      onSelect(type)
      setOpen(false)
    }
  }

  const handleFileChange = (type: AttachmentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onSelect(type, Array.from(files))
      setOpen(false)
    }
    e.target.value = ""
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          {attachmentOptions.map(({ type, icon: Icon, label, color, accept, multiple }) => (
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
                  multiple={multiple}
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
