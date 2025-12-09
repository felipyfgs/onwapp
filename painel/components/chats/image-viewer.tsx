"use client"

import { useState } from "react"
import Image from "next/image"
import { X, Download, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImageViewerProps {
  src: string
  alt?: string
  open: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, open, onClose }: ImageViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <DialogTitle className="sr-only">Visualizar imagem</DialogTitle>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <span className="text-white/70 text-sm">{alt}</span>
          <div className="flex items-center gap-2">
            <ImageViewerContent src={src} alt={alt} onClose={onClose} />
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center w-full h-[90vh] overflow-hidden relative">
          <Image
            src={src}
            alt={alt || "Image"}
            fill
            className="object-contain"
            onClick={(e) => e.stopPropagation()}
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ImageViewerContentProps {
  src: string
  alt?: string
  onClose: () => void
}

function ImageViewerContent({ src, alt, onClose }: ImageViewerContentProps) {
  const [scale, setScale] = useState(1)

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5))

  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = alt || "image"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erro ao baixar imagem:", err)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomOut}
        className="text-white hover:bg-white/20"
        disabled={scale <= 0.5}
      >
        <ZoomOut className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomIn}
        className="text-white hover:bg-white/20"
        disabled={scale >= 3}
      >
        <ZoomIn className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className="text-white hover:bg-white/20"
      >
        <Download className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="text-white hover:bg-white/20"
      >
        <X className="size-5" />
      </Button>
    </>
  )
}
