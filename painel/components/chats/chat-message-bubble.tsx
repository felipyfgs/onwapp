"use client"

import { Check, CheckCheck, FileText, Play, Download } from "lucide-react"
import { ChatMessage } from "@/lib/api/chats"
import { cn } from "@/lib/utils"

interface ChatMessageBubbleProps {
  message: ChatMessage
  isGroup: boolean
  showSender: boolean
}

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function MessageStatus({ status, fromMe }: { status?: string; fromMe: boolean }) {
  if (!fromMe) return null

  if (status === "read") {
    return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3.5 w-3.5 opacity-70" />
  }
  return <Check className="h-3.5 w-3.5 opacity-70" />
}

function AudioMessage() {
  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button className="h-9 w-9 rounded-full bg-background/20 flex items-center justify-center shrink-0">
        <Play className="h-4 w-4 ml-0.5" />
      </button>
      <div className="flex-1">
        <div className="h-1 bg-current/30 rounded-full" />
        <span className="text-[10px] opacity-70 mt-1 block">0:00</span>
      </div>
    </div>
  )
}

function DocumentMessage({ content }: { content?: string }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-background/10 rounded-lg min-w-[200px]">
      <div className="h-10 w-10 rounded bg-destructive/20 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{content || "Documento"}</p>
        <p className="text-[10px] opacity-70">PDF</p>
      </div>
      <button className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Download className="h-4 w-4 text-primary" />
      </button>
    </div>
  )
}

function MediaPlaceholder({ type }: { type: string }) {
  return (
    <div className="w-[240px] aspect-video bg-background/10 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Play className="h-10 w-10 mx-auto opacity-50" />
        <span className="text-xs opacity-70 mt-1 block capitalize">{type}</span>
      </div>
    </div>
  )
}

export function ChatMessageBubble({ message, isGroup, showSender }: ChatMessageBubbleProps) {
  const isFromMe = message.fromMe
  const isDeleted = message.deleted
  const isAudio = message.type === "audio" || message.type === "ptt" || message.mediaType === "audio"
  const isDocument = message.type === "document" || message.mediaType === "document"
  const isImage = message.type === "image" || message.mediaType === "image"
  const isVideo = message.type === "video" || message.mediaType === "video"

  return (
    <div className={cn("flex mb-1", isFromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-3 py-1.5 rounded-lg",
          isFromMe ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border border-border",
          isDeleted && "opacity-60 italic"
        )}
      >
        {/* Sender name for groups */}
        {isGroup && !isFromMe && showSender && message.pushName && (
          <p className="text-xs font-semibold text-primary mb-1">{message.pushName}</p>
        )}

        {/* Message content */}
        <div>
          {isDeleted ? (
            <p className="text-sm italic">Mensagem apagada</p>
          ) : isAudio ? (
            <AudioMessage />
          ) : isDocument ? (
            <DocumentMessage content={message.content} />
          ) : isImage || isVideo ? (
            <MediaPlaceholder type={isImage ? "imagem" : "vídeo"} />
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content || `[${message.mediaType || message.type}]`}
            </p>
          )}
        </div>

        {/* Timestamp and status */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] opacity-70">{formatTime(message.timestamp)}</span>
          <MessageStatus status={message.status} fromMe={isFromMe} />
        </div>
      </div>
    </div>
  )
}
