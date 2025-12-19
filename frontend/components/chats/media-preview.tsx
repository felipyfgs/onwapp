"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, FileText, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { MediaMessage } from "@/lib/nats/nats-types"

interface MediaPreviewProps {
  media: MediaMessage
  className?: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function ImagePreview({ media, className = "" }: MediaPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`block rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity ${className}`}
      >
        <img 
          src={media.thumbnail || media.url} 
          alt={media.filename || "Imagem"} 
          className="max-w-xs max-h-48 object-cover"
        />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-background border-border p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img 
              src={media.url} 
              alt={media.filename || "Imagem"} 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AudioPreview({ media, className = "" }: MediaPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(media.duration || 0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  function handleSliderChange(value: number[]) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  return (
    <div className={`flex items-center gap-2 bg-muted p-2 rounded-lg min-w-[200px] ${className}`}>
      <audio ref={audioRef} src={media.url} preload="metadata" />
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-foreground" />
        ) : (
          <Play className="h-4 w-4 text-foreground" />
        )}
      </Button>
      
      <div className="flex-1 flex items-center gap-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          className="flex-1"
        />
      </div>
      
      <span className="text-xs text-muted-foreground shrink-0 min-w-[35px] text-right">
        {formatDuration(isPlaying ? currentTime : duration)}
      </span>
    </div>
  )
}

function VideoPreview({ media, className = "" }: MediaPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative block rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity ${className}`}
      >
        <img 
          src={media.thumbnail || media.url} 
          alt={media.filename || "Vídeo"} 
          className="max-w-xs max-h-48 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
          <div className="bg-background/80 rounded-full p-2">
            <Play className="h-6 w-6 text-foreground" />
          </div>
        </div>
        {media.duration && (
          <span className="absolute bottom-1 right-1 bg-background/80 text-foreground text-xs px-1.5 py-0.5 rounded">
            {formatDuration(media.duration)}
          </span>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-background border-border p-0">
          <video 
            src={media.url} 
            controls 
            autoPlay
            className="w-full h-auto max-h-[80vh]"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function DocumentPreview({ media, className = "" }: MediaPreviewProps) {
  function getFileExtension(filename?: string): string {
    if (!filename) return 'FILE'
    const ext = filename.split('.').pop()?.toUpperCase()
    return ext || 'FILE'
  }

  return (
    <a 
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 bg-muted p-3 rounded-lg border border-border hover:bg-accent transition-colors ${className}`}
    >
      <div className="bg-primary/10 p-2 rounded">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium truncate">
          {media.filename || 'Documento'}
        </p>
        <p className="text-xs text-muted-foreground">
          {getFileExtension(media.filename)}
        </p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground shrink-0" />
    </a>
  )
}

export function MediaPreview({ media, className = "" }: MediaPreviewProps) {
  switch (media.type) {
    case 'image':
      return <ImagePreview media={media} className={className} />
    case 'audio':
      return <AudioPreview media={media} className={className} />
    case 'video':
      return <VideoPreview media={media} className={className} />
    case 'document':
      return <DocumentPreview media={media} className={className} />
    default:
      return null
  }
}
