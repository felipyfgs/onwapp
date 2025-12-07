"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, X, Send, Trash2, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
  onSend: (audioBlob: Blob) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

type RecordingState = "idle" | "recording" | "paused" | "preview"

export function AudioRecorder({ onSend, onCancel, disabled }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle")
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [sending, setSending] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setState("preview")
      }

      mediaRecorder.start(100)
      setState("recording")
      setDuration(0)
      
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (err) {
      console.error("Erro ao acessar microfone:", err)
      alert("Permissao para microfone negada")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    
    setAudioUrl(null)
    setAudioBlob(null)
    setDuration(0)
    setState("idle")
    onCancel()
  }, [audioUrl, onCancel])

  const handleSend = async () => {
    if (!audioBlob) return
    setSending(true)
    try {
      await onSend(audioBlob)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
      setAudioBlob(null)
      setDuration(0)
      setState("idle")
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [audioUrl])

  if (state === "idle") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        disabled={disabled}
        onClick={startRecording}
      >
        <Mic className="size-5" />
      </Button>
    )
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-3 flex-1 bg-destructive/10 rounded-full px-4 py-2">
        <button
          onClick={cancelRecording}
          className="text-destructive hover:text-destructive/80"
        >
          <Trash2 className="size-5" />
        </button>
        
        <div className="flex-1 flex items-center gap-2">
          <span className="size-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium text-destructive">
            {formatDuration(duration)}
          </span>
          <div className="flex-1 flex items-center justify-center gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-destructive/60 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 16 + 4}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            Deslize para cancelar
          </span>
        </div>
        
        <button
          onClick={stopRecording}
          className="size-10 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90"
        >
          <Send className="size-4" />
        </button>
      </div>
    )
  }

  if (state === "preview" && audioUrl) {
    return (
      <div className="flex items-center gap-3 flex-1 bg-muted rounded-full px-4 py-2">
        <button
          onClick={cancelRecording}
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="size-5" />
        </button>
        
        <div className="flex-1 flex items-center gap-2">
          <audio src={audioUrl} className="hidden" id="preview-audio" />
          <AudioPreviewPlayer src={audioUrl} duration={duration} />
        </div>
        
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending}
          className="size-10 rounded-full"
        >
          {sending ? (
            <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    )
  }

  return null
}

function AudioPreviewPlayer({ src, duration }: { src: string; duration: number }) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-2 flex-1">
      <audio ref={audioRef} src={src} />
      <button
        onClick={togglePlay}
        className="size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
      </button>
      <div className="flex-1 h-1 bg-muted-foreground/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground min-w-[40px]">
        {formatTime(playing ? currentTime : duration)}
      </span>
    </div>
  )
}
