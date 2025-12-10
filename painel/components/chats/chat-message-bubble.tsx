"use client"

import { memo } from "react"
import { Check, CheckCheck, FileText, Play, Download, Clock } from "lucide-react"
import { ChatMessage } from "@/lib/api/chats"
import { cn } from "@/lib/utils"
import { formatTime, isAudioMessage, isDocumentMessage, isImageMessage, isVideoMessage } from "@/lib/utils/chat-helpers"

interface ChatMessageBubbleProps {
  message: ChatMessage
  isGroup: boolean
  showSender: boolean
}

function MessageStatus({ status, fromMe }: { status?: string; fromMe: boolean }) {
  if (!fromMe) return null

  if (status === "read") {
    return <CheckCheck className="h-4 w-4 text-sky-400" />
  }
  if (status === "delivered") {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />
  }
  if (status === "sent") {
    return <Check className="h-4 w-4 text-muted-foreground" />
  }
  return <Clock className="h-3 w-3 text-muted-foreground" />
}

function AudioMessage() {
  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button className="h-9 w-9 rounded-full bg-background/20 flex items-center justify-center shrink-0 hover:bg-background/30 transition-colors">
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
      <button className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 hover:bg-primary/30 transition-colors">
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

export const ChatMessageBubble = memo(function ChatMessageBubble({ 
  message, 
  isGroup, 
  showSender 
}: ChatMessageBubbleProps) {
  const isFromMe = message.fromMe
  const isDeleted = message.deleted
  const isAudio = isAudioMessage(message)
  const isDocument = isDocumentMessage(message)
  const isImage = isImageMessage(message)
  const isVideo = isVideoMessage(message)

  return (
    <div className={cn("flex", isFromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[75%] px-3 py-2 shadow-sm",
          isFromMe
            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
            : "bg-card text-card-foreground rounded-2xl rounded-tl-sm",
          isDeleted && "opacity-60 italic"
        )}
      >
        {/* Sender name for groups */}
        {isGroup && !isFromMe && showSender && message.pushName && (
          <p className="text-xs font-semibold text-primary mb-0.5">{message.pushName}</p>
        )}

        {/* Message content */}
        <div className="leading-relaxed">
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
        <div className="flex items-center justify-end gap-1 -mb-0.5 mt-0.5">
          <span className={cn(
            "text-[11px]",
            isFromMe ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {formatTime(message.timestamp)}
          </span>
          <MessageStatus status={message.status} fromMe={isFromMe} />
        </div>
      </div>
    </div>
  )
})
