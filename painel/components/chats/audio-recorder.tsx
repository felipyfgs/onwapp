"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Send, Trash2, Pause, Play, Square } from "lucide-react"
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
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(25).fill(0.1))
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationRef = useRef<number | null>(null)

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    mediaRecorderRef.current = null
  }, [])

  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current || state !== "recording") return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const levels: number[] = []
    const chunkSize = Math.floor(dataArray.length / 25)
    
    for (let i = 0; i < 25; i++) {
      let sum = 0
      for (let j = 0; j < chunkSize; j++) {
        sum += dataArray[i * chunkSize + j]
      }
      const avg = sum / chunkSize / 255
      levels.push(Math.max(0.1, avg))
    }
    
    setAudioLevels(levels)
    animationRef.current = requestAnimationFrame(updateAudioLevels)
  }, [state])

  const startRecording = useCallback(async () => {
    setError(null)
    
    // Check if running in secure context (HTTPS or localhost)
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'
    )
    const isSecure = typeof window !== 'undefined' && (
      window.isSecureContext || 
      window.location.protocol === 'https:' ||
      isLocalhost
    )
    
    if (!isSecure) {
      setError("Gravacao requer HTTPS. Configure SSL ou acesse via localhost.")
      return
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Navegador nao suporta gravacao de audio.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      streamRef.current = stream

      // Setup audio analyzer for waveform
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Detect supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        ''
      ]
      
      let mimeType = ''
      for (const type of mimeTypes) {
        if (type === '' || MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          break
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setState("preview")
        setAudioLevels(Array(25).fill(0.3))
      }

      mediaRecorder.onerror = () => {
        setError("Erro durante gravacao")
        cleanupRecording()
        setState("idle")
      }

      mediaRecorder.start(100)
      setState("recording")
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)

      // Start visualizer
      animationRef.current = requestAnimationFrame(updateAudioLevels)

    } catch (err) {
      console.error("Erro ao acessar microfone:", err)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError("Permissao para microfone negada")
        } else if (err.name === 'NotFoundError') {
          setError("Microfone nao encontrado")
        } else {
          setError("Erro ao acessar microfone")
        }
      } else {
        setError("Erro ao iniciar gravacao")
      }
      cleanupRecording()
    }
  }, [cleanupRecording, updateAudioLevels])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause()
      setState("paused")
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [state])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume()
      setState("recording")
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
      animationRef.current = requestAnimationFrame(updateAudioLevels)
    }
  }, [state, updateAudioLevels])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      mediaRecorderRef.current.stop()
      cleanupRecording()
    }
  }, [state, cleanupRecording])

  const cancelRecording = useCallback(() => {
    cleanupRecording()
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setAudioBlob(null)
    setRecordingTime(0)
    setState("idle")
    setError(null)
    setAudioLevels(Array(25).fill(0.1))
    onCancel()
  }, [audioUrl, cleanupRecording, onCancel])

  const handleSend = useCallback(async () => {
    if (!audioBlob) return
    setSending(true)
    try {
      await onSend(audioBlob)
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      setAudioUrl(null)
      setAudioBlob(null)
      setRecordingTime(0)
      setState("idle")
      setAudioLevels(Array(25).fill(0.1))
    } catch (err) {
      setError("Erro ao enviar audio")
    } finally {
      setSending(false)
    }
  }, [audioBlob, audioUrl, onSend])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording()
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [cleanupRecording, audioUrl])

  // Error display
  if (error) {
    return (
      <div className="flex items-center gap-3 flex-1 bg-destructive/10 rounded-full px-4 py-2">
        <span className="text-sm text-destructive flex-1">{error}</span>
        <Button variant="ghost" size="sm" onClick={() => setError(null)}>
          OK
        </Button>
      </div>
    )
  }

  // Idle state - mic button
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

  // Recording or paused state
  if (state === "recording" || state === "paused") {
    return (
      <div className={cn(
        "flex items-center gap-3 flex-1 rounded-full px-4 py-2",
        state === "paused" ? "bg-yellow-500/10" : "bg-destructive/10"
      )}>
        <button
          onClick={cancelRecording}
          className={cn(
            "hover:opacity-80",
            state === "paused" ? "text-yellow-600" : "text-destructive"
          )}
        >
          <Trash2 className="size-5" />
        </button>
        
        <div className="flex-1 flex items-center gap-2">
          <span className={cn(
            "size-2 rounded-full",
            state === "paused" ? "bg-yellow-500" : "bg-destructive animate-pulse"
          )} />
          <span className={cn(
            "text-sm font-medium",
            state === "paused" ? "text-yellow-600" : "text-destructive"
          )}>
            {formatTime(recordingTime)}
          </span>
          
          {/* Real waveform visualization */}
          <div className="flex-1 flex items-center justify-center gap-0.5">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-75",
                  state === "paused" ? "bg-yellow-500/60" : "bg-destructive/60"
                )}
                style={{
                  height: `${Math.max(4, level * 20)}px`,
                }}
              />
            ))}
          </div>
          
          {state === "paused" && (
            <span className="text-xs text-yellow-600">Pausado</span>
          )}
        </div>
        
        {/* Pause/Resume button */}
        <button
          onClick={state === "paused" ? resumeRecording : pauseRecording}
          className="size-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted/80"
        >
          {state === "paused" ? (
            <Play className="size-4" />
          ) : (
            <Pause className="size-4" />
          )}
        </button>
        
        {/* Stop and go to preview */}
        <button
          onClick={stopRecording}
          className={cn(
            "size-10 text-white rounded-full flex items-center justify-center hover:opacity-90",
            state === "paused" ? "bg-yellow-500" : "bg-destructive"
          )}
        >
          <Square className="size-4" />
        </button>
      </div>
    )
  }

  // Preview state
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
          <AudioPreviewPlayer src={audioUrl} duration={recordingTime} />
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
  const [audioDuration, setAudioDuration] = useState(duration)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }, [playing])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }
    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
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

  // Static waveform for preview
  const waveformBars = Array.from({ length: 30 }, (_, i) => {
    const height = (Math.sin(i * 0.5) * 0.4 + 0.6) * 16 + 4
    return height
  })

  return (
    <div className="flex items-center gap-2 flex-1">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={togglePlay}
        className="size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0"
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
      </button>
      
      {/* Waveform with progress */}
      <div className="flex-1 flex items-center gap-0.5">
        {waveformBars.map((height, i) => {
          const barProgress = (i / waveformBars.length) * 100
          const isPlayed = barProgress < progress
          return (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-colors",
                isPlayed ? "bg-primary" : "bg-primary/30"
              )}
              style={{ height: `${height}px` }}
            />
          )
        })}
      </div>
      
      <span className="text-xs text-muted-foreground min-w-[40px]">
        {formatTime(playing ? currentTime : audioDuration)}
      </span>
    </div>
  )
}
