"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { getContactAvatarUrl } from "@/lib/api/contacts"

interface AudioPlayerProps {
  src: string
  duration?: number
  senderName?: string
  senderJid?: string
  sessionId?: string
  isMe?: boolean
  className?: string
}

export function AudioPlayer({ src, duration = 0, senderName, senderJid, sessionId, isMe, className }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Fetch avatar
  useEffect(() => {
    if (senderJid && sessionId && !isMe) {
      const phone = senderJid.split('@')[0]
      getContactAvatarUrl(sessionId, phone).then(url => setAvatarUrl(url))
    }
  }, [senderJid, sessionId, isMe])

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

  // Waveform bars
  const bars = 28
  const waveformData = Array.from({ length: bars }, (_, i) => {
    const seed = i * 7 + 3
    return (Math.sin(seed) * 0.5 + 0.5) * 0.7 + 0.3
  })

  return (
    <div className={cn("flex items-center gap-2 min-w-[180px]", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Avatar with mic badge */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={senderName || ""} 
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <div className={cn(
            "size-10 rounded-full flex items-center justify-center text-white font-medium",
            isMe ? "bg-[#00a884]" : "bg-[#8696a0]"
          )}>
            {senderName?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 size-4 rounded-full flex items-center justify-center",
          isMe ? "bg-[#075e54]" : "bg-[#667781]"
        )}>
          <Mic className="size-2.5 text-white" />
        </div>
      </div>
      
      {/* Play button */}
      <button
        onClick={togglePlay}
        className={cn(
          "size-8 rounded-full flex items-center justify-center shrink-0",
          isMe 
            ? "text-[#075e54] hover:bg-white/10" 
            : "text-[#00a884]"
        )}
      >
        {playing ? (
          <Pause className="size-5" fill="currentColor" />
        ) : (
          <Play className="size-5 ml-0.5" fill="currentColor" />
        )}
      </button>
      
      {/* Waveform and time */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-[2px] h-5">
          {waveformData.map((height, i) => {
            const barProgress = (i / bars) * 100
            const isPlayed = barProgress < progress
            return (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-colors",
                  isPlayed 
                    ? isMe ? "bg-[#075e54]" : "bg-[#00a884]"
                    : isMe ? "bg-[#075e54]/40" : "bg-[#8696a0]"
                )}
                style={{ height: `${height * 100}%` }}
              />
            )
          })}
        </div>
        
        <div className="flex items-center justify-between text-[10px]">
          <span className={isMe ? "text-[#075e54]/70" : "text-[#667781]"}>
            {formatTime(playing ? currentTime : audioDuration)}
          </span>
          {playing && (
            <button
              onClick={toggleSpeed}
              className={cn(
                "font-semibold px-1 rounded",
                isMe ? "text-[#075e54]" : "text-[#667781] bg-[#e9edef]"
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
