"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Send, Trash2, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
  onSend: (audioBlob: Blob) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

type RecordingState = "idle" | "recording" | "preview"

export function AudioRecorder({ onSend, onCancel, disabled }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle")
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(25).fill(0.15))
  
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
    if (timerRef.current) clearInterval(timerRef.current)
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close()
    timerRef.current = null
    animationRef.current = null
    streamRef.current = null
    audioContextRef.current = null
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
      for (let j = 0; j < chunkSize; j++) sum += dataArray[i * chunkSize + j]
      levels.push(Math.max(0.15, Math.min(1, (sum / chunkSize / 255) * 1.5)))
    }
    
    setAudioLevels(levels)
    animationRef.current = requestAnimationFrame(updateAudioLevels)
  }, [state])

  const startRecording = useCallback(async () => {
    setError(null)
    
    const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
    const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || isLocalhost)
    
    if (!isSecure) { setError("Requer HTTPS"); return }
    if (!navigator.mediaDevices?.getUserMedia) { setError("Sem suporte"); return }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', ''].find(t => !t || MediaRecorder.isTypeSupported(t)) || ''
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setState("preview")
      }
      mediaRecorder.onerror = () => { setError("Erro"); cleanupRecording(); setState("idle") }

      mediaRecorder.start(100)
      setState("recording")
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
      animationRef.current = requestAnimationFrame(updateAudioLevels)
    } catch (err) {
      const msg = err instanceof DOMException ? 
        (err.name === 'NotAllowedError' ? "Permissao negada" : "Erro no mic") : "Erro"
      setError(msg)
      cleanupRecording()
    }
  }, [cleanupRecording, updateAudioLevels])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop()
      cleanupRecording()
    }
  }, [state, cleanupRecording])

  const cancelRecording = useCallback(() => {
    cleanupRecording()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setAudioBlob(null)
    setRecordingTime(0)
    setState("idle")
    setError(null)
    setAudioLevels(Array(25).fill(0.15))
    onCancel()
  }, [audioUrl, cleanupRecording, onCancel])

  const handleSend = useCallback(async () => {
    if (!audioBlob) return
    setSending(true)
    try {
      await onSend(audioBlob)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
      setAudioBlob(null)
      setRecordingTime(0)
      setState("idle")
    } catch { setError("Erro ao enviar") }
    finally { setSending(false) }
  }, [audioBlob, audioUrl, onSend])

  useEffect(() => {
    return () => { cleanupRecording(); if (audioUrl) URL.revokeObjectURL(audioUrl) }
  }, [cleanupRecording, audioUrl])

  if (error) {
    return (
      <div className="flex items-center gap-2 flex-1 bg-red-50 dark:bg-red-950/30 rounded-full px-3 py-1.5">
        <span className="text-xs text-red-600 flex-1">{error}</span>
        <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 px-2 text-xs">OK</Button>
      </div>
    )
  }

  if (state === "idle") {
    return (
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" disabled={disabled} onClick={startRecording}>
        <Mic className="size-5" />
      </Button>
    )
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-2 flex-1 bg-background border rounded-full px-3 py-1.5">
        <button onClick={cancelRecording} className="text-red-500 hover:text-red-600">
          <Trash2 className="size-4" />
        </button>
        
        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-medium min-w-[32px]">{formatTime(recordingTime)}</span>
        
        <div className="flex-1 flex items-center justify-center gap-[2px] h-5">
          {audioLevels.map((level, i) => (
            <div key={i} className="w-[2px] rounded-full bg-red-500/70 transition-all duration-75" style={{ height: `${Math.max(3, level * 20)}px` }} />
          ))}
        </div>
        
        <button onClick={stopRecording} className="size-8 bg-[#00a884] hover:bg-[#008f72] text-white rounded-full flex items-center justify-center">
          <Send className="size-4" />
        </button>
      </div>
    )
  }

  if (state === "preview" && audioUrl) {
    return (
      <div className="flex items-center gap-2 flex-1 bg-background border rounded-full px-3 py-1.5">
        <button onClick={cancelRecording} className="text-muted-foreground hover:text-foreground">
          <Trash2 className="size-4" />
        </button>
        
        <AudioPreviewPlayer src={audioUrl} duration={recordingTime} />
        
        <button onClick={handleSend} disabled={sending} className="size-8 bg-[#00a884] hover:bg-[#008f72] disabled:opacity-50 text-white rounded-full flex items-center justify-center">
          {sending ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="size-4" />}
        </button>
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
    const handleEnded = () => { setPlaying(false); setCurrentTime(0) }
    const handleLoaded = () => { if (audio.duration && isFinite(audio.duration)) setAudioDuration(audio.duration) }
    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadedmetadata", handleLoaded)
    return () => { audio.removeEventListener("timeupdate", updateTime); audio.removeEventListener("ended", handleEnded); audio.removeEventListener("loadedmetadata", handleLoaded) }
  }, [])

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0
  const waveformBars = Array.from({ length: 30 }, (_, i) => (Math.sin(i * 0.4) * 0.3 + 0.5) * 16 + 4)

  return (
    <div className="flex items-center gap-2 flex-1">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={togglePlay} className="size-7 bg-[#00a884] text-white rounded-full flex items-center justify-center shrink-0">
        {playing ? <Pause className="size-3.5" fill="currentColor" /> : <Play className="size-3.5 ml-0.5" fill="currentColor" />}
      </button>
      <div className="flex-1 flex items-center gap-[2px] h-5">
        {waveformBars.map((height, i) => (
          <div key={i} className={cn("w-[2px] rounded-full transition-colors", (i / waveformBars.length) * 100 < progress ? "bg-[#00a884]" : "bg-muted-foreground/40")} style={{ height: `${height}px` }} />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground min-w-[28px]">
        {Math.floor((playing ? currentTime : audioDuration) / 60)}:{Math.floor((playing ? currentTime : audioDuration) % 60).toString().padStart(2, "0")}
      </span>
    </div>
  )
}
