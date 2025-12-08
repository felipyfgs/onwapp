"use client"

import { useState, useEffect } from "react"
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ImageViewerProps {
  src: string
  alt?: string
  open: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, open, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScale(1)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRotation(0)
    }
  }, [open])

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <DialogTitle className="sr-only">Visualizar imagem</DialogTitle>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <span className="text-white/70 text-sm">{alt}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="size-5" />
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
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center w-full h-[90vh] overflow-hidden">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
