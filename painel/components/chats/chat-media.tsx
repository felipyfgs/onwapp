"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Pause, Download, FileText, File, FileImage, FileVideo, FileAudio, Loader2, Mic } from "lucide-react"
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
  avatar?: string
}

// Pre-generated waveform pattern (deterministic)
const WAVEFORM_BARS = [
  0.4, 0.6, 0.8, 0.5, 0.9, 0.7, 1.0, 0.6, 0.8, 0.5,
  0.7, 0.9, 0.6, 1.0, 0.7, 0.5, 0.8, 0.6, 0.9, 0.7,
  0.5, 0.8, 1.0, 0.6, 0.7, 0.9, 0.5, 0.8, 0.6, 0.7,
]

export function AudioMessage({ src, isFromMe, avatar }: AudioMessageProps) {
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)

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

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const value = parseFloat(e.target.value)
    audioRef.current.currentTime = value
    setCurrentTime(value)
  }, [])

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Main row */}
      <div className="flex items-center gap-2">
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          disabled={error}
          className={cn(
            "shrink-0 flex items-center justify-center w-8 h-8",
            error && "opacity-50 cursor-not-allowed"
          )}
        >
          {playing ? (
            <Pause className="h-7 w-7" />
          ) : (
            <Play className="h-7 w-7" />
          )}
        </button>

        {/* Waveform container with slider */}
        <div className="flex-1 relative h-[32px]">
          {/* Waveform bars (visual only) */}
          <div className="absolute inset-0 flex items-center gap-[2px] pointer-events-none">
            {WAVEFORM_BARS.map((height, i) => {
              const barProgress = ((i + 0.5) / WAVEFORM_BARS.length) * 100
              const isPlayed = barProgress <= progress
              return (
                <div 
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-colors duration-150",
                    isPlayed 
                      ? (isFromMe ? "bg-primary-foreground" : "bg-sky-500")
                      : (isFromMe ? "bg-primary-foreground/30" : "bg-muted-foreground/40")
                  )}
                  style={{ height: `${height * 70}%`, minHeight: '4px' }}
                />
              )
            })}
          </div>
          
          {/* Range slider (transparent, handles interaction) */}
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          {/* Custom thumb indicator */}
          <div 
            className={cn(
              "absolute top-1/2 w-3 h-3 rounded-full pointer-events-none transition-opacity",
              isFromMe ? "bg-primary-foreground" : "bg-sky-500",
              "shadow-sm"
            )}
            style={{ 
              left: `${progress}%`,
              transform: 'translate(-50%, -50%)',
              opacity: playing || currentTime > 0 ? 1 : 0
            }}
          />
        </div>

        {/* Avatar with mic overlay */}
        <div className="relative shrink-0">
          {avatar ? (
            <div className="w-[36px] h-[36px] rounded-full overflow-hidden border-2 border-background">
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={cn(
              "w-[36px] h-[36px] rounded-full flex items-center justify-center",
              isFromMe ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              <Mic className="h-4 w-4 opacity-60" />
            </div>
          )}
          {/* Mic indicator overlay */}
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full flex items-center justify-center",
            isFromMe ? "bg-primary" : "bg-emerald-500"
          )}>
            <Mic className="h-2 w-2 text-white" />
          </div>
        </div>
      </div>

      {/* Duration below */}
      <div className="flex items-center justify-between mt-0.5 ml-10 mr-[44px]">
        <span className="text-[10px] opacity-70">
          {playing || currentTime > 0 ? formatTime(currentTime) : (duration > 0 ? formatTime(duration) : "0:00")}
        </span>
        {playing && (
          <span className="text-[10px] font-medium opacity-70">1.0x</span>
        )}
      </div>
    </div>
  )
}

interface DocumentMessageProps {
  src: string
  filename?: string
  isFromMe?: boolean
}

function DocumentIcon({ filename, isFromMe }: { filename?: string; isFromMe?: boolean }) {
  const iconClass = cn("h-5 w-5", isFromMe ? "text-primary-foreground" : "text-destructive")
  
  if (!filename) return <FileText className={iconClass} />
  
  const ext = filename.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "pdf":
      return <FileText className={iconClass} />
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return <FileImage className={iconClass} />
    case "mp4":
    case "avi":
    case "mov":
    case "webm":
      return <FileVideo className={iconClass} />
    case "mp3":
    case "wav":
    case "ogg":
    case "m4a":
      return <FileAudio className={iconClass} />
    default:
      return <File className={iconClass} />
  }
}

export function DocumentMessage({ src, filename, isFromMe }: DocumentMessageProps) {
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
        <DocumentIcon filename={filename} isFromMe={isFromMe} />
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
