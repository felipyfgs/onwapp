"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Pause, Download, FileText, File, FileImage, FileVideo, FileAudio, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageMessageProps {
  src: string
  caption?: string
  onView?: () => void
}

export function ImageMessage({ src, caption, onView }: ImageMessageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className="relative">
      <div 
        className={cn(
          "relative rounded-lg overflow-hidden cursor-pointer max-w-[280px]",
          loading && "min-h-[120px] bg-background/20"
        )}
        onClick={onView}
      >
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin opacity-50" />
          </div>
        )}
        {error ? (
          <div className="flex items-center justify-center h-[120px] bg-background/20 rounded-lg">
            <FileImage className="h-8 w-8 opacity-50" />
          </div>
        ) : (
          <img
            src={src}
            alt="Imagem"
            className={cn(
              "max-w-full rounded-lg transition-opacity",
              loading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false)
              setError(true)
            }}
          />
        )}
      </div>
      {caption && (
        <p className="text-sm mt-1 whitespace-pre-wrap break-words">{caption}</p>
      )}
    </div>
  )
}

interface VideoMessageProps {
  src: string
  caption?: string
  onView?: () => void
}

export function VideoMessage({ src, caption, onView }: VideoMessageProps) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setPlaying(!playing)
    }
  }, [playing])

  return (
    <div className="relative">
      <div className="relative rounded-lg overflow-hidden max-w-[280px]">
        {error ? (
          <div 
            className="flex items-center justify-center h-[160px] bg-background/20 rounded-lg cursor-pointer"
            onClick={onView}
          >
            <FileVideo className="h-8 w-8 opacity-50" />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              className="max-w-full rounded-lg"
              onEnded={() => setPlaying(false)}
              onError={() => setError(true)}
              onClick={togglePlay}
              playsInline
            />
            {!playing && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-6 w-6 text-black ml-0.5" />
                </div>
              </button>
            )}
          </>
        )}
      </div>
      {caption && (
        <p className="text-sm mt-1 whitespace-pre-wrap break-words">{caption}</p>
      )}
    </div>
  )
}

interface AudioMessageProps {
  src: string
  isFromMe?: boolean
}

export function AudioMessage({ src, isFromMe }: AudioMessageProps) {
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }
    const handleError = () => setError(true)

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setPlaying(!playing)
    }
  }, [playing])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    audioRef.current.currentTime = percentage * duration
  }, [duration])

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button
        onClick={togglePlay}
        disabled={error}
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
          isFromMe 
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" 
            : "bg-primary/20 hover:bg-primary/30",
          error && "opacity-50 cursor-not-allowed"
        )}
      >
        {playing ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div 
          className="h-1.5 bg-current/20 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div 
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all",
              isFromMe ? "bg-primary-foreground/70" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
          {/* Waveform bars */}
          <div className="absolute inset-0 flex items-center justify-around px-1 opacity-30">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-0.5 rounded-full",
                  isFromMe ? "bg-primary-foreground" : "bg-primary"
                )}
                style={{ 
                  height: `${Math.random() * 100}%`,
                  minHeight: "20%"
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] opacity-70">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] opacity-70">
            {duration > 0 ? formatTime(duration) : "--:--"}
          </span>
        </div>
      </div>
    </div>
  )
}

interface DocumentMessageProps {
  src: string
  filename?: string
  isFromMe?: boolean
}

const getDocumentIcon = (filename?: string) => {
  if (!filename) return FileText
  const ext = filename.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "pdf":
      return FileText
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return FileImage
    case "mp4":
    case "avi":
    case "mov":
    case "webm":
      return FileVideo
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
      return FileAudio
    default:
      return File
  }
}

export function DocumentMessage({ src, filename, isFromMe }: DocumentMessageProps) {
  const Icon = getDocumentIcon(filename)
  const displayName = filename || "Documento"
  const ext = filename?.split(".").pop()?.toUpperCase() || "FILE"

  const handleDownload = useCallback(() => {
    window.open(src, "_blank")
  }, [src])

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg min-w-[200px] cursor-pointer",
        isFromMe ? "bg-primary-foreground/10" : "bg-background/10"
      )}
      onClick={handleDownload}
    >
      <div className={cn(
        "h-10 w-10 rounded flex items-center justify-center shrink-0",
        isFromMe ? "bg-primary-foreground/20" : "bg-destructive/20"
      )}>
        <Icon className={cn(
          "h-5 w-5",
          isFromMe ? "text-primary-foreground" : "text-destructive"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        <p className="text-[10px] opacity-70">{ext}</p>
      </div>
      <button className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
        isFromMe 
          ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" 
          : "bg-primary/20 hover:bg-primary/30"
      )}>
        <Download className={cn(
          "h-4 w-4",
          isFromMe ? "text-primary-foreground" : "text-primary"
        )} />
      </button>
    </div>
  )
}

interface StickerMessageProps {
  src: string
  onView?: () => void
}

export function StickerMessage({ src, onView }: StickerMessageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div 
      className={cn(
        "relative w-[128px] h-[128px] cursor-pointer",
        loading && "bg-transparent"
      )}
      onClick={onView}
    >
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin opacity-50" />
        </div>
      )}
      {error ? (
        <div className="flex items-center justify-center h-full opacity-50">
          <FileImage className="h-8 w-8" />
        </div>
      ) : (
        <img
          src={src}
          alt="Sticker"
          className={cn(
            "w-full h-full object-contain transition-opacity",
            loading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        />
      )}
    </div>
  )
}
