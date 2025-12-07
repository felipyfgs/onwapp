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
      case 'pending': return <Clock className="size-3 text-muted-foreground" />
      case 'sent': return <Check className="size-3 text-muted-foreground" />
      case 'delivered': return <CheckCheck className="size-3 text-muted-foreground" />
      case 'read': return <CheckCheck className="size-3 text-blue-500" />
      default: return <Check className="size-3 text-muted-foreground" />
    }
  }

  const getMediaUrl = (msgId?: string) => {
    if (!msgId || !sessionId) return null
    // Use the public media stream endpoint (no auth required for browser playback)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    return `${apiUrl}/public/${sessionId}/media/stream?messageId=${msgId}`
  }

  const renderContent = () => {
    const type = message.mediaType || message.type
    
    // System message
    if (type === 'system' || message.type === 'system') {
      return null // Handled separately
    }

    // Text message with link detection
    if (type === 'text' || !type) {
      return (
        <p className="whitespace-pre-wrap break-words">
          {renderTextWithLinks(message.content || '')}
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
                className="relative cursor-pointer rounded-lg overflow-hidden max-w-[280px]"
                onClick={() => setImageViewerOpen(true)}
              >
                <img 
                  src={imageUrl} 
                  alt="Imagem" 
                  className="w-full h-auto rounded-lg"
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
              <span className="italic">Foto</span>
            </div>
          )}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
            <div className="relative rounded-lg overflow-hidden max-w-[280px] bg-black">
              <video 
                src={videoUrl} 
                controls 
                className="w-full h-auto rounded-lg"
                preload="metadata"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Play className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-sm">Video</span>
              </div>
            </div>
          )}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      )
    }

    // Audio / Voice note (PTT)
    if (type === 'audio' || type === 'ptt') {
      const audioUrl = getMediaUrl(message.msgId)
      if (audioUrl) {
        return (
          <AudioPlayer
            src={audioUrl}
            senderName={type === 'ptt' ? message.pushName : undefined}
            isMe={isMe}
          />
        )
      }
      return (
        <div className="flex items-center gap-2">
          <Mic className="size-4" />
          <span className="italic text-muted-foreground">
            {type === 'ptt' ? 'Mensagem de voz' : 'Audio'}
          </span>
        </div>
      )
    }

    // Document
    if (type === 'document') {
      return (
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg min-w-[200px]">
          <div className="size-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="size-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {message.content || 'Documento'}
            </p>
            <p className="text-xs text-muted-foreground">PDF</p>
          </div>
          <button className="shrink-0 text-muted-foreground hover:text-foreground">
            <Download className="size-5" />
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
          className="size-32 object-contain"
          loading="lazy"
        />
      ) : (
        <div className="flex items-center gap-2">
          <Sticker className="size-4" />
          <span className="italic text-muted-foreground">Figurinha</span>
        </div>
      )
    }

    // Location
    if (type === 'location') {
      return (
        <div className="space-y-2">
          <div className="w-[250px] h-[150px] bg-muted rounded-lg flex items-center justify-center">
            <MapPin className="size-8 text-green-500" />
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
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg min-w-[200px]">
          <div className="size-10 bg-sky-500/20 rounded-full flex items-center justify-center shrink-0">
            <Contact2 className="size-5 text-sky-500" />
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

    // Default/Unknown type
    return (
      <div className="flex items-center gap-2 text-muted-foreground italic">
        <span>{message.content || type || 'Mensagem'}</span>
      </div>
    )
  }

  // System message - special rendering
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {message.content || 'Mensagem do sistema'}
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex mb-1", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2 shadow-sm",
          isMe 
            ? "bg-primary text-primary-foreground rounded-br-none" 
            : "bg-card border rounded-bl-none"
        )}
      >
        {showSender && !isMe && message.pushName && (
          <p className="text-xs font-medium text-primary mb-1">
            {message.pushName}
          </p>
        )}
        
        <div className="text-sm">
          {renderContent()}
        </div>
        
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isMe ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span className="text-[10px]">{formatTime(message.timestamp)}</span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  )
}

// Helper to render text with clickable links
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
          className="text-blue-400 hover:underline break-all"
        >
          {part}
        </a>
      )
    }
    return part
  })
}
