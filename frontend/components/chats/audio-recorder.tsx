"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, X, Send, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AudioRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void
  disabled?: boolean
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'recorded'

export function AudioRecorder({ onSend, disabled = false }: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setState('recorded')
      }
      
      mediaRecorder.start()
      setState('recording')
      setDuration(0)
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('recording')
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  function cancelRecording() {
    cleanup()
    setAudioBlob(null)
    setDuration(0)
    setState('idle')
  }

  function handleSend() {
    if (audioBlob) {
      onSend(audioBlob, duration)
      cancelRecording()
    } else if (state === 'recording' || state === 'paused') {
      stopRecording()
    }
  }

  if (state === 'idle') {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        disabled={disabled}
        onClick={startRecording}
        className="h-10 w-10 shrink-0"
      >
        <Mic className="h-5 w-5 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1.5 rounded-full">
      <span className={`w-2 h-2 rounded-full ${state === 'recording' ? 'bg-destructive animate-pulse' : 'bg-muted-foreground'}`} />
      
      <span className="text-foreground text-sm font-medium min-w-[40px]">
        {formatDuration(duration)}
      </span>
      
      {state === 'recording' && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={pauseRecording}
          className="h-7 w-7"
        >
          <Pause className="h-4 w-4 text-foreground" />
        </Button>
      )}
      
      {state === 'paused' && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={resumeRecording}
          className="h-7 w-7"
        >
          <Play className="h-4 w-4 text-foreground" />
        </Button>
      )}
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={cancelRecording}
        className="h-7 w-7"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </Button>
      
      <Button 
        variant="default" 
        size="icon" 
        onClick={handleSend}
        className="h-8 w-8"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
