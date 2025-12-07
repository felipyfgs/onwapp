"use client"

import { Check, CheckCheck, Clock, Image, Video, Mic, FileText, MapPin, Contact2, Sticker, Reply } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/api/chats"

interface ChatMessageItemProps {
  message: ChatMessage
  showSender?: boolean
}

export function ChatMessageItem({ message, showSender }: ChatMessageItemProps) {
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

  const getMediaIcon = () => {
    const type = message.mediaType || message.type
    switch (type) {
      case 'image': return <Image className="size-4" />
      case 'video': return <Video className="size-4" />
      case 'audio':
      case 'ptt': return <Mic className="size-4" />
      case 'document': return <FileText className="size-4" />
      case 'sticker': return <Sticker className="size-4" />
      case 'location': return <MapPin className="size-4" />
      case 'contact':
      case 'vcard': return <Contact2 className="size-4" />
      default: return null
    }
  }

  const renderContent = () => {
    const type = message.mediaType || message.type
    
    if (type === 'system' || message.type === 'system') {
      return (
        <div className="text-center py-1">
          <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {message.content || 'Mensagem do sistema'}
          </span>
        </div>
      )
    }
    
    if (type === 'text' || !type) {
      return message.content
    }

    const mediaIcon = getMediaIcon()
    const labels: Record<string, string> = {
      image: 'Foto',
      video: 'Video',
      audio: 'Audio',
      ptt: 'Mensagem de voz',
      document: 'Documento',
      sticker: 'Figurinha',
      location: 'Localizacao',
      contact: 'Contato',
      vcard: 'Contato',
    }

    return (
      <div className="flex items-center gap-2">
        {mediaIcon}
        <span className="text-muted-foreground italic">
          {labels[type] || type}
        </span>
        {message.content && (
          <span className="ml-1">{message.content}</span>
        )}
      </div>
    )
  }

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
        
        <div className="text-sm break-words whitespace-pre-wrap">
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
