"use client"

import { useState, useRef, useCallback } from "react"
import { Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmojiPicker } from "./emoji-picker"
import { AttachmentMenu, type AttachmentType } from "./attachment-menu"
import { AudioRecorder } from "./audio-recorder"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>
  onSendAudio?: (audioBlob: Blob) => Promise<void>
  onSendFile?: (type: AttachmentType, file: File) => Promise<void>
  onLocationRequest?: () => void
  onContactRequest?: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSendMessage,
  onSendAudio,
  onSendFile,
  onLocationRequest,
  onContactRequest,
  disabled,
  placeholder = "Digite uma mensagem" 
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(async () => {
    const text = message.trim()
    if (!text || sending || disabled) return
    
    setSending(true)
    try {
      await onSendMessage(text)
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } finally {
      setSending(false)
    }
  }, [message, sending, disabled, onSendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  const handleAttachmentSelect = async (type: AttachmentType, file?: File) => {
    if (type === "location" && onLocationRequest) {
      onLocationRequest()
      return
    }
    if (type === "contact" && onContactRequest) {
      onContactRequest()
      return
    }
    if (file && onSendFile) {
      await onSendFile(type, file)
    }
  }

  const handleAudioSend = async (audioBlob: Blob) => {
    if (onSendAudio) {
      await onSendAudio(audioBlob)
    }
    setIsRecording(false)
  }

  const hasText = message.trim().length > 0

  if (isRecording) {
    return (
      <div className="border-t bg-background p-3">
        <AudioRecorder
          onSend={handleAudioSend}
          onCancel={() => setIsRecording(false)}
          disabled={disabled}
        />
      </div>
    )
  }

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        {/* Emoji picker */}
        <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />

        {/* Attachment menu */}
        <AttachmentMenu onSelect={handleAttachmentSelect} disabled={disabled} />

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            className="min-h-[44px] max-h-[150px] resize-none py-3 pr-10 rounded-2xl bg-muted/50 border-0 focus-visible:ring-1"
            rows={1}
          />
          {message && (
            <button
              onClick={() => setMessage("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Send or Mic button */}
        {hasText ? (
          <Button
            onClick={handleSend}
            disabled={sending || disabled}
            size="icon"
            className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
          >
            {sending ? (
              <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            disabled={disabled}
            onClick={() => setIsRecording(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}
