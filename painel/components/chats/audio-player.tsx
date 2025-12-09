"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { getContactAvatarUrl, getMyProfile } from "@/lib/api/contacts"

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
    if (!sessionId) return
    
    if (isMe) {
      getMyProfile(sessionId)
        .then(profile => setAvatarUrl(profile.avatar))
        .catch(() => setAvatarUrl(null))
    } else if (senderJid) {
      const phone = senderJid.split('@')[0]
      getContactAvatarUrl(sessionId, phone)
        .then(url => setAvatarUrl(url))
        .catch(() => setAvatarUrl(null))
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
    <div className={cn("flex items-center gap-2 min-w-[200px]", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Avatar with mic badge */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl} 
            alt={senderName || "Avatar"} 
            width={46}
            height={46}
            className="size-[46px] rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div 
            className="size-[46px] rounded-full flex items-center justify-center font-medium text-lg"
            style={isMe 
              ? { backgroundColor: 'oklch(0.30 0.08 165)', color: 'oklch(0.95 0.01 165)' }
              : { backgroundColor: 'oklch(0.60 0.03 269.46)', color: 'oklch(0.95 0.01 270)' }
            }
          >
            {senderName?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div 
          className="absolute -bottom-0.5 -right-0.5 size-[18px] rounded-full flex items-center justify-center"
          style={isMe 
            ? { backgroundColor: 'oklch(0.30 0.08 165 / 0.8)', color: 'oklch(0.95 0.01 165)' }
            : { backgroundColor: 'oklch(0.60 0.03 269.46 / 0.8)', color: 'oklch(0.95 0.01 270)' }
          }
        >
          <Mic className="size-3" />
        </div>
      </div>
      
      {/* Play button + Waveform + Time */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="size-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={isMe
              ? { color: 'oklch(0.90 0.01 165)' }
              : { color: 'oklch(0.75 0.01 270)' }
            }
          >
            {playing ? (
              <Pause className="size-6" fill="currentColor" />
            ) : (
              <Play className="size-6 ml-0.5" fill="currentColor" />
            )}
          </button>
          
          <div className="flex-1 flex items-center gap-[2px] h-[26px]">
            {waveformData.map((height, i) => {
              const barProgress = (i / bars) * 100
              const isPlayed = barProgress < progress
              return (
                <div
                  key={i}
                  className="w-[3px] rounded-full transition-colors"
                  style={{
                    height: `${height * 100}%`,
                    backgroundColor: isPlayed 
                      ? (isMe ? 'oklch(0.80 0.01 165)' : 'oklch(0.67 0.17 153.85)')
                      : (isMe ? 'oklch(0.50 0.01 165 / 0.4)' : 'oklch(0.60 0.03 269.46 / 0.4)')
                  }}
                />
              )
            })}
          </div>
        </div>
        
        {/* Time row */}
        <div className="flex items-center pl-10 text-[11px]">
          <span 
            style={isMe 
              ? { color: 'oklch(0.80 0.01 165 / 0.7)' }
              : { color: 'oklch(0.75 0.01 270 / 0.8)' }
            }
          >
            {formatTime(playing ? currentTime : audioDuration)}
          </span>
          {playing && (
            <button
              onClick={toggleSpeed}
              className="ml-auto font-semibold px-1.5 py-0.5 rounded text-[10px]"
              style={{
                backgroundColor: 'oklch(0.30 0.02 270 / 0.5)',
                color: 'oklch(0.85 0.01 270)',
              }}
            >
              {playbackRate}x
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
