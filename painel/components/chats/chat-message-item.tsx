"use client"

import { useState } from "react"
import { Check, CheckCheck, Clock, Image as ImageIcon, Video, Mic, FileText, MapPin, Contact2, Sticker, Download, Play, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { AudioPlayer } from "./audio-player"
import { ImageViewer } from "./image-viewer"
import type { ChatMessage } from "@/lib/api/chats"

interface ChatMessageItemProps {
  message: ChatMessage
  showSender?: boolean
  sessionId?: string
}

export function ChatMessageItem({ message, showSender, sessionId }: ChatMessageItemProps) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const isMe = message.fromMe

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusIcon = () => {
    if (!isMe) return null
    switch (message.status) {
      case 'pending': return <Clock className="size-3" />
      case 'sent': return <Check className="size-3" />
      case 'delivered': return <CheckCheck className="size-3" />
      case 'read': return <CheckCheck className="size-3 text-sky-400" />
      default: return <Check className="size-3" />
    }
  }

  const getMediaUrl = (msgId?: string) => {
    if (!msgId || !sessionId) return null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    return `${apiUrl}/public/${sessionId}/media/stream?messageId=${msgId}`
  }

  // Check if message is emoji-only (1-3 emojis, no other text)
  const isEmojiOnly = (text: string) => {
    const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,3}$/u
    return emojiRegex.test(text.trim())
  }

  const renderContent = () => {
    const type = message.mediaType || message.type
    
    if (type === 'system' || message.type === 'system') {
      return null
    }

    // Text message
    if (type === 'text' || !type) {
      const content = message.content || ''
      
      // Large emoji rendering (WhatsApp style)
      if (isEmojiOnly(content)) {
        return (
          <span className="text-5xl leading-tight">{content}</span>
        )
      }
      
      return (
        <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
          {renderTextWithLinks(content)}
        </p>
      )
    }

    // Image
    if (type === 'image') {
      const imageUrl = getMediaUrl(message.msgId) || message.content
      return (
        <div className="space-y-1">
          {imageUrl ? (
            <>
              <div 
                className="relative cursor-pointer rounded-md overflow-hidden"
                onClick={() => setImageViewerOpen(true)}
              >
                <img 
                  src={imageUrl} 
                  alt="Imagem" 
                  className="max-w-[330px] max-h-[330px] w-auto h-auto rounded-md"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
              </div>
              <ImageViewer
                src={imageUrl}
                alt="Imagem"
                open={imageViewerOpen}
                onClose={() => setImageViewerOpen(false)}
              />
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ImageIcon className="size-4" />
              <span className="text-sm italic">Foto</span>
            </div>
          )}
          {message.content && !message.content.startsWith('http') && (
            <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      )
    }

    // Video
    if (type === 'video') {
      const videoUrl = getMediaUrl(message.msgId)
      return (
        <div className="space-y-1">
          {videoUrl ? (
            <div className="relative rounded-md overflow-hidden bg-black">
              <video 
                src={videoUrl} 
                controls 
                className="max-w-[330px] max-h-[330px] w-auto h-auto rounded-md"
                preload="metadata"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
              <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Play className="size-5 text-primary" />
              </div>
              <span className="text-sm">Video</span>
            </div>
          )}
          {message.content && (
            <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      )
    }

    // Audio / Voice note
    if (type === 'audio' || type === 'ptt') {
      const audioUrl = getMediaUrl(message.msgId)
      if (audioUrl) {
        return (
          <AudioPlayer
            src={audioUrl}
            senderName={type === 'ptt' ? message.pushName : undefined}
            senderJid={message.senderJid}
            sessionId={sessionId}
            isMe={isMe}
          />
        )
      }
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mic className="size-4" />
          <span className="text-sm italic">
            {type === 'ptt' ? 'Mensagem de voz' : 'Audio'}
          </span>
        </div>
      )
    }

    // Document
    if (type === 'document') {
      return (
        <div className="flex items-center gap-3 p-2 bg-muted/20 rounded-md min-w-[240px]">
          <div className="size-10 bg-red-500/20 rounded flex items-center justify-center shrink-0">
            <FileText className="size-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {message.content || 'Documento'}
            </p>
            <p className="text-xs text-muted-foreground">PDF</p>
          </div>
          <button className="shrink-0 p-2 rounded-full hover:bg-muted/30 transition-colors">
            <Download className="size-5 text-muted-foreground" />
          </button>
        </div>
      )
    }

    // Sticker
    if (type === 'sticker') {
      const stickerUrl = getMediaUrl(message.msgId)
      return stickerUrl ? (
        <img 
          src={stickerUrl} 
          alt="Sticker" 
          className="size-[150px] object-contain"
          loading="lazy"
        />
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sticker className="size-4" />
          <span className="text-sm italic">Figurinha</span>
        </div>
      )
    }

    // Location
    if (type === 'location') {
      return (
        <div className="space-y-2">
          <div className="w-[250px] h-[130px] bg-muted/30 rounded-md flex items-center justify-center">
            <MapPin className="size-8 text-primary" />
          </div>
          {message.content && (
            <p className="text-sm">{message.content}</p>
          )}
          <a 
            href={`https://maps.google.com/?q=${message.content}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            Abrir no Maps
          </a>
        </div>
      )
    }

    // Contact
    if (type === 'contact' || type === 'vcard') {
      return (
        <div className="flex items-center gap-3 p-2 bg-muted/20 rounded-md min-w-[200px]">
          <div className="size-10 bg-sky-500/20 rounded-full flex items-center justify-center shrink-0">
            <Contact2 className="size-5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {message.content || 'Contato'}
            </p>
            <p className="text-xs text-muted-foreground">Contato</p>
          </div>
        </div>
      )
    }

    // Default
    return (
      <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
        <span>{message.content || type || 'Mensagem'}</span>
      </div>
    )
  }

  // System message
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[12.5px] text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg shadow-sm">
          {message.content || 'Mensagem do sistema'}
        </span>
      </div>
    )
  }

  const content = message.content || ''
  const isEmoji = (message.type === 'text' || !message.mediaType) && isEmojiOnly(content)

  // Emoji-only messages don't have bubble
  if (isEmoji) {
    return (
      <div className={cn("flex mb-1", isMe ? "justify-end" : "justify-start")}>
        <div className="flex flex-col items-end">
          <span className="text-5xl leading-tight">{content}</span>
          <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
            <span className="text-[11px]">{formatTime(message.timestamp)}</span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex mb-0.5", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[65%] rounded-lg shadow-sm",
          isMe 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-card border rounded-tl-sm"
        )}
      >
        {/* Message tail */}
        <div className={cn(
          "absolute top-0 w-3 h-3 overflow-hidden",
          isMe ? "-right-1.5" : "-left-1.5"
        )}>
          <div className={cn(
            "absolute w-3 h-3 transform rotate-45",
            isMe 
              ? "bg-primary -left-1.5" 
              : "bg-card border-l border-t -right-1.5"
          )} />
        </div>

        <div className="px-2 py-1.5">
          {showSender && !isMe && message.pushName && (
            <p className="text-xs font-medium text-primary mb-0.5">
              {message.pushName}
            </p>
          )}
          
          {renderContent()}
          
          <div className={cn(
            "flex items-center justify-end gap-1 -mb-0.5 mt-0.5",
            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            <span className="text-[11px]">{formatTime(message.timestamp)}</span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:underline break-all"
        >
          {part}
        </a>
      )
    }
    return part
  })
}
