"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Send, X, Reply, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmojiPicker } from "./emoji-picker"
import { AttachmentMenu, type AttachmentType } from "./attachment-menu"
import { AudioRecorder } from "./audio-recorder"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/api/chats"

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>
  onSendAudio?: (audioBlob: Blob) => Promise<void>
  onSelectFiles?: (type: AttachmentType, files: File[]) => void
  onLocationRequest?: () => void
  onContactRequest?: () => void
  disabled?: boolean
  placeholder?: string
  replyingTo?: ChatMessage | null
  editingMessage?: ChatMessage | null
  onCancelReplyOrEdit?: () => void
}

export function ChatInput({ 
  onSendMessage,
  onSendAudio,
  onSelectFiles,
  onLocationRequest,
  onContactRequest,
  disabled,
  placeholder = "Digite uma mensagem",
  replyingTo,
  editingMessage,
  onCancelReplyOrEdit,
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || "")
      textareaRef.current?.focus()
    }
  }, [editingMessage])

  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus()
    }
  }, [replyingTo])

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
    if (e.key === 'Escape' && (replyingTo || editingMessage)) {
      onCancelReplyOrEdit?.()
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

  const handleAttachmentSelect = (type: AttachmentType, files?: File[]) => {
    if (type === "location" && onLocationRequest) {
      onLocationRequest()
      return
    }
    if (type === "contact" && onContactRequest) {
      onContactRequest()
      return
    }
    if (files && files.length > 0 && onSelectFiles) {
      onSelectFiles(type, files)
    }
  }

  const handleAudioSend = async (audioBlob: Blob) => {
    if (onSendAudio) {
      await onSendAudio(audioBlob)
    }
    setIsRecording(false)
  }

  const hasText = message.trim().length > 0
  const isReplying = !!replyingTo
  const isEditing = !!editingMessage

  if (isRecording) {
    return (
      <div className="border-t border-border bg-card p-3">
        <AudioRecorder
          onSend={handleAudioSend}
          onCancel={() => setIsRecording(false)}
          disabled={disabled}
        />
      </div>
    )
  }

  return (
    <div className="border-t border-border bg-card">
      {/* Reply/Edit preview bar */}
      {(isReplying || isEditing) && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b border-border">
          <div className="p-1.5 rounded-full bg-primary/20">
            {isEditing ? (
              <Pencil className="size-4 text-primary" />
            ) : (
              <Reply className="size-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-primary">
              {isEditing ? "Editando mensagem" : `Respondendo ${replyingTo?.fromMe ? "a voce" : replyingTo?.pushName || "mensagem"}`}
            </p>
            <p className="text-[13px] text-muted-foreground truncate">
              {isEditing ? editingMessage?.content : replyingTo?.content}
            </p>
          </div>
          <button
            onClick={onCancelReplyOrEdit}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
        <AttachmentMenu onSelect={handleAttachmentSelect} disabled={disabled} />

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            className="min-h-[44px] max-h-[150px] resize-none py-3 pr-10 rounded-lg bg-muted border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
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

        {hasText ? (
          <Button
            onClick={handleSend}
            disabled={sending || disabled}
            size="icon"
            className="shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
            className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
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
