"use client"

import { useState, useRef, useCallback } from "react"
import { Send, Paperclip, Smile, Mic, X, Image, FileText, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>
  onSendFile?: (file: File) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSendMessage, 
  onSendFile,
  disabled,
  placeholder = "Digite uma mensagem" 
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    // Auto-resize
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onSendFile) {
      await onSendFile(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 text-muted-foreground hover:text-foreground"
              disabled={disabled}
            >
              <Paperclip className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Image className="size-4 mr-2 text-blue-500" />
              Foto ou Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileText className="size-4 mr-2 text-purple-500" />
              Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Camera className="size-4 mr-2 text-pink-500" />
              Camera
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,application/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
        />

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            className="min-h-[44px] max-h-[150px] resize-none pr-10 py-3"
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

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          size="icon"
          className={cn(
            "shrink-0 transition-all",
            message.trim() ? "bg-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {sending ? (
            <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
