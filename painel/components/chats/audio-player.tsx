"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
  src: string
  duration?: number
  senderName?: string
  isMe?: boolean
  className?: string
}

export function AudioPlayer({ src, duration = 0, senderName, isMe, className }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const [playbackRate, setPlaybackRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setPlaying(!playing)
    }
  }

  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackRate)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    setPlaybackRate(nextSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration)
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  // Generate waveform bars
  const bars = 30
  const waveformData = Array.from({ length: bars }, (_, i) => {
    // Create a pseudo-random but consistent pattern
    const seed = i * 7 + 3
    return (Math.sin(seed) * 0.5 + 0.5) * 0.8 + 0.2
  })

  return (
    <div className={cn("flex items-center gap-2 min-w-[200px]", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Avatar for PTT */}
      {senderName && (
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className={cn(
            "text-white text-sm",
            isMe ? "bg-primary" : "bg-slate-400"
          )}>
            {senderName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Play button */}
      <button
        onClick={togglePlay}
        className={cn(
          "size-8 rounded-full flex items-center justify-center shrink-0",
          isMe ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
      </button>
      
      {/* Waveform */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-end gap-0.5 h-6">
          {waveformData.map((height, i) => {
            const barProgress = (i / bars) * 100
            const isPlayed = barProgress < progress
            return (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-colors",
                  isPlayed 
                    ? isMe ? "bg-primary-foreground" : "bg-primary"
                    : isMe ? "bg-primary-foreground/40" : "bg-muted-foreground/40"
                )}
                style={{ height: `${height * 100}%` }}
              />
            )
          })}
        </div>
        
        {/* Time and speed */}
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-[10px]",
            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {formatTime(playing ? currentTime : audioDuration)}
          </span>
          {playing && (
            <button
              onClick={toggleSpeed}
              className={cn(
                "text-[10px] font-medium px-1 rounded",
                isMe ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {playbackRate}x
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
