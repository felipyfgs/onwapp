"use client"

import { useState, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmojiPicker } from "./emoji-picker"
import { AttachmentButton } from "./attachment-button"
import { AudioRecorder } from "./audio-recorder"
import { QuickReplies } from "./quick-replies"
import { QuickReply } from "@/lib/nats/nats-types"

interface MessageInputProps {
  onSendMessage: (message: string) => void
  onSendAudio?: (blob: Blob, duration: number) => void
  onSendFile?: (file: File, type: 'image' | 'document') => void
  quickReplies?: QuickReply[]
  disabled?: boolean
}

export function MessageInput({ 
  onSendMessage, 
  onSendAudio,
  onSendFile,
  quickReplies,
  disabled = false 
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }
  
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleEmojiSelect(emoji: string) {
    setMessage(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  function handleQuickReplySelect(replyMessage: string) {
    setMessage(replyMessage)
    textareaRef.current?.focus()
  }

  function handleAudioSend(blob: Blob, duration: number) {
    if (onSendAudio) {
      onSendAudio(blob, duration)
    }
  }

  function handleFileSelect(file: File, type: 'image' | 'document') {
    if (onSendFile) {
      onSendFile(file, type)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex items-center gap-1">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
        <AttachmentButton onFileSelect={handleFileSelect} disabled={disabled} />
      </div>
      
      <div className="flex-1 bg-background rounded-lg px-3 py-2 flex items-center min-h-[42px] shadow-sm border border-border/50">
        <QuickReplies 
          replies={quickReplies || []} 
          inputValue={message}
          onSelect={handleQuickReplySelect}
        >
          <textarea
            ref={textareaRef}
            placeholder="Digite uma mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 resize-none border-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 max-h-32 pt-1"
            rows={1}
          />
        </QuickReplies>
      </div>
      
      <div className="flex items-center">
        {message.trim() ? (
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 rounded-full"
            disabled={disabled}
          >
            <Send className="h-5 w-5 text-primary-foreground" />
          </Button>
        ) : (
          <AudioRecorder onSend={handleAudioSend} disabled={disabled} />
        )}
      </div>
    </form>
  )
}
