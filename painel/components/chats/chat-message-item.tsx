"use client"

import { useState } from "react"
import { Check, CheckCheck, Clock, Image as ImageIcon, Video, Mic, FileText, MapPin, Contact2, Sticker, Download, Play, ExternalLink, Reply, Pencil, Trash2, ChevronDown, Copy, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import { AudioPlayer } from "./audio-player"
import { ImageViewer } from "./image-viewer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ChatMessage } from "@/lib/api/chats"

interface ChatMessageItemProps {
  message: ChatMessage
  showSender?: boolean
  sessionId?: string
  myJid?: string
  allMessages?: ChatMessage[]
  onReply?: (message: ChatMessage) => void
  onReact?: (message: ChatMessage, emoji: string) => void
  onEdit?: (message: ChatMessage) => void
  onDelete?: (message: ChatMessage, forMe: boolean) => void
  onScrollToMessage?: (msgId: string) => void
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

// Action menu component (defined outside to avoid re-creation during render)
interface ActionMenuProps {
  message: ChatMessage
  isMe: boolean
  isTextMessage: boolean
  onReply?: (message: ChatMessage) => void
  onReact?: (message: ChatMessage, emoji: string) => void
  onEdit?: (message: ChatMessage) => void
  onDelete?: (message: ChatMessage, forMe: boolean) => void
}

function ActionMenu({ message, isMe, isTextMessage, onReply, onReact, onEdit, onDelete }: ActionMenuProps) {
  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "absolute top-0 p-1 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity z-10",
          isMe 
            ? "right-0 bg-gradient-to-bl from-primary via-primary/80 to-transparent" 
            : "right-0 bg-gradient-to-bl from-card via-card/80 to-transparent"
        )}>
          <ChevronDown className={cn("size-3.5", isMe ? "text-primary-foreground/80" : "text-muted-foreground")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isMe ? "end" : "start"} 
        side="right"
        sideOffset={4}
        collisionPadding={8}
        className="min-w-[160px] p-0 rounded-md shadow-lg border-0 bg-popover overflow-hidden"
      >
        {/* Quick reactions bar */}
        <div className="flex justify-between px-2 py-1.5 bg-muted/50 border-b border-border/50">
          {QUICK_REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact?.(message, emoji)}
              className="text-base hover:scale-110 transition-transform duration-150"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {/* Menu items */}
        <div className="py-0.5">
          <DropdownMenuItem 
            onClick={() => onReply?.(message)}
            className="px-3 py-1.5 text-[13px] cursor-pointer"
          >
            <Reply className="size-4 mr-2 text-muted-foreground" />
            Responder
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleCopy}
            className="px-3 py-1.5 text-[13px] cursor-pointer"
          >
            <Copy className="size-4 mr-2 text-muted-foreground" />
            Copiar
          </DropdownMenuItem>
          
          {isMe && isTextMessage && (
            <DropdownMenuItem 
              onClick={() => onEdit?.(message)}
              className="px-3 py-1.5 text-[13px] cursor-pointer"
            >
              <Pencil className="size-4 mr-2 text-muted-foreground" />
              Editar
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator className="my-0.5" />
          
          <DropdownMenuItem 
            onClick={() => onDelete?.(message, true)}
            className="px-3 py-1.5 text-[13px] cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4 mr-2" />
            Apagar para mim
          </DropdownMenuItem>
          
          {isMe && (
            <DropdownMenuItem 
              onClick={() => onDelete?.(message, false)}
              className="px-3 py-1.5 text-[13px] cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4 mr-2" />
              Apagar para todos
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ChatMessageItem({ 
  message, 
  showSender, 
  sessionId,
  myJid,
  allMessages,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onScrollToMessage,
}: ChatMessageItemProps) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const isMe = message.fromMe
  const isTextMessage = message.type === 'text' || (!message.mediaType && !!message.content)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusIcon = () => {
    if (!isMe) return null
    switch (message.status) {
      case 'pending': return <Clock className="size-3 shrink-0" />
      case 'sent': return <Check className="size-3 shrink-0" />
      case 'delivered': return <CheckCheck className="size-3 shrink-0" />
      case 'read': return <CheckCheck className="size-3 text-primary shrink-0" />
      default: return <Check className="size-3 shrink-0" />
    }
  }

  const getMediaUrl = (msgId?: string) => {
    if (!msgId || !sessionId) return null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    return `${apiUrl}/public/${sessionId}/media/stream?messageId=${msgId}`
  }

  const isEmojiOnly = (text: string) => {
    const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,3}$/u
    return emojiRegex.test(text.trim())
  }

  const renderContent = () => {
    const type = message.mediaType || message.type
    
    if (type === 'system' || message.type === 'system') return null

    if (type === 'text' || !type) {
      const content = message.content || ''
      if (isEmojiOnly(content)) {
        return <span className="text-5xl leading-tight">{content}</span>
      }
      return (
        <span className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
          {renderTextWithLinks(content)}
        </span>
      )
    }

    if (type === 'image') {
      const imageUrl = getMediaUrl(message.msgId) || message.content
      return (
        <div className="space-y-1">
          {imageUrl ? (
            <>
              <div 
                className="relative cursor-pointer rounded overflow-hidden"
                onClick={() => setImageViewerOpen(true)}
              >
                <img 
                  src={imageUrl} 
                  alt="Imagem" 
                  className="max-w-[330px] max-h-[330px] w-auto h-auto rounded bg-muted/50"
                  loading="lazy"
                />
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

    if (type === 'video') {
      const videoUrl = getMediaUrl(message.msgId)
      return (
        <div className="space-y-1">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              className="max-w-[330px] max-h-[330px] w-auto h-auto rounded"
              preload="metadata"
              poster=""
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-secondary rounded">
              <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Play className="size-5 text-primary" />
              </div>
              <span className="text-sm">Video</span>
            </div>
          )}
        </div>
      )
    }

    if (type === 'audio' || type === 'ptt') {
      const audioUrl = getMediaUrl(message.msgId)
      if (audioUrl) {
        return (
          <AudioPlayer
            src={audioUrl}
            senderName={message.pushName}
            senderJid={message.senderJid}
            sessionId={sessionId}
            isMe={isMe}
          />
        )
      }
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mic className="size-4" />
          <span className="text-sm italic">{type === 'ptt' ? 'Mensagem de voz' : 'Audio'}</span>
        </div>
      )
    }

    if (type === 'document') {
      return (
        <div className="flex items-center gap-3 p-2 bg-secondary rounded min-w-[240px]">
          <div className="size-10 bg-destructive/20 rounded flex items-center justify-center shrink-0">
            <FileText className="size-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.content || 'Documento'}</p>
            <p className="text-xs text-muted-foreground">PDF</p>
          </div>
          <button className="shrink-0 p-2 rounded-full hover:bg-accent">
            <Download className="size-5 text-muted-foreground" />
          </button>
        </div>
      )
    }

    if (type === 'sticker') {
      const stickerUrl = getMediaUrl(message.msgId)
      return stickerUrl ? (
        <img src={stickerUrl} alt="Sticker" className="size-[150px] object-contain" loading="lazy" />
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sticker className="size-4" />
          <span className="text-sm italic">Figurinha</span>
        </div>
      )
    }

    if (type === 'location') {
      return (
        <div className="space-y-2">
          <div className="w-[250px] h-[130px] bg-secondary rounded flex items-center justify-center">
            <MapPin className="size-8 text-primary" />
          </div>
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

    if (type === 'contact' || type === 'vcard') {
      return (
        <div className="flex items-center gap-3 p-2 bg-secondary rounded min-w-[200px]">
          <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Contact2 className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.content || 'Contato'}</p>
            <p className="text-xs text-muted-foreground">Contato</p>
          </div>
        </div>
      )
    }

    return <span className="text-muted-foreground italic text-sm">{message.content || type || 'Mensagem'}</span>
  }

  // System message
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3 px-3">
        <span className="text-[12.5px] text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg shadow-sm">
          {message.content || 'Mensagem do sistema'}
        </span>
      </div>
    )
  }

  // Deleted message
  if (message.deleted) {
    return (
      <div className={cn("flex mb-[2px] px-3 sm:px-4 md:px-6", isMe ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "relative rounded-[7.5px] shadow-sm",
            "max-w-[85%] sm:max-w-[75%] md:max-w-[65%]",
            isMe 
              ? "bg-primary/50 text-primary-foreground/70" 
              : "bg-card/50 text-muted-foreground border border-border/50"
          )}
        >
          {/* Tail SVG */}
          <div className={cn("absolute top-0", isMe ? "-right-[8px]" : "-left-[8px]")}>
            <svg viewBox="0 0 8 13" width="8" height="13">
              {isMe ? (
                <path className="fill-primary/50" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
              ) : (
                <path className="fill-card/50" strokeWidth="1" d="M1.533 3.568 8 12.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z" />
              )}
            </svg>
          </div>

          <div className="pl-[9px] pr-[12px] py-[6px] flex items-center gap-2">
            <Ban className="size-[14px] opacity-70" />
            <span className="text-[13.5px] italic">
              {isMe ? 'Você apagou esta mensagem' : 'Esta mensagem foi apagada'}
            </span>
            <span className={cn(
              "text-[11px] ml-1",
              isMe ? "text-primary-foreground/50" : "text-muted-foreground/70"
            )}>
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const content = message.content || ''
  const isEmoji = (message.type === 'text' || !message.mediaType) && isEmojiOnly(content)

  // Emoji-only messages (no bubble)
  if (isEmoji) {
    return (
      <div className={cn("flex mb-1 px-3 sm:px-4 md:px-6", isMe ? "justify-end" : "justify-start")}>
        <div className="flex flex-col items-end group relative">
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
    <div className={cn("flex mb-[2px] px-3 sm:px-4 md:px-6", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative group rounded-[7.5px] shadow-sm",
          "max-w-[85%] sm:max-w-[75%] md:max-w-[65%]",
          isMe 
            ? "bg-primary text-primary-foreground" 
            : "bg-card text-card-foreground border border-border"
        )}
      >
        {/* Tail SVG */}
        <div className={cn("absolute top-0", isMe ? "-right-[8px]" : "-left-[8px]")}>
          <svg viewBox="0 0 8 13" width="8" height="13">
            {isMe ? (
              <path className="fill-primary" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
            ) : (
              <path className="fill-card" strokeWidth="1" d="M1.533 3.568 8 12.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z" />
            )}
          </svg>
        </div>

        <ActionMenu 
          message={message}
          isMe={isMe}
          isTextMessage={isTextMessage}
          onReply={onReply}
          onReact={onReact}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        <div className="pl-[9px] pr-[28px] pt-[6px] pb-[8px]">
          {showSender && !isMe && message.pushName && (
            <p className="text-[12.8px] font-medium text-primary mb-[2px]">
              {message.pushName}
            </p>
          )}
          
          {message.quotedId && (() => {
            const quotedMsg = allMessages?.find(m => m.msgId === message.quotedId)
            const quotedContent = quotedMsg?.content || 'Mensagem'
            
            let quotedSenderName = 'Contato'
            if (quotedMsg) {
              quotedSenderName = quotedMsg.fromMe ? 'Você' : (quotedMsg.pushName || 'Contato')
            } else if (message.quotedSender) {
              const isQuotedFromMe = myJid && message.quotedSender === myJid
              quotedSenderName = isQuotedFromMe ? 'Você' : 'Contato'
            }
            
            const isMedia = quotedMsg?.mediaType && quotedMsg.mediaType !== 'text'
            
            return (
              <div 
                onClick={() => onScrollToMessage?.(message.quotedId!)}
                className={cn(
                  "text-[12px] px-2 py-1.5 mb-1.5 rounded-[5px] border-l-[4px] cursor-pointer hover:brightness-110 transition-all",
                  isMe 
                    ? "bg-primary-foreground/10 border-primary-foreground/50" 
                    : "bg-secondary border-primary"
                )}
              >
                <p className={cn("text-[12.5px] font-medium mb-0.5", isMe ? "text-primary-foreground/80" : "text-primary")}>{quotedSenderName}</p>
                <p className={cn("line-clamp-1", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {isMedia ? (
                    <span className="flex items-center gap-1">
                      {quotedMsg?.mediaType === 'image' && <><ImageIcon className="size-3" /> Foto</>}
                      {quotedMsg?.mediaType === 'video' && <><Video className="size-3" /> Video</>}
                      {(quotedMsg?.mediaType === 'audio' || quotedMsg?.mediaType === 'ptt') && <><Mic className="size-3" /> Audio</>}
                      {quotedMsg?.mediaType === 'document' && <><FileText className="size-3" /> Documento</>}
                      {quotedMsg?.mediaType === 'sticker' && <><Sticker className="size-3" /> Figurinha</>}
                    </span>
                  ) : quotedContent}
                </p>
              </div>
            )
          })()}
          
          <div>
            {renderContent()}
            <span className={cn(
              "float-right text-[11px] mt-[4px] ml-[8px] flex items-center gap-1",
              isMe ? "text-primary-foreground/60" : "text-muted-foreground"
            )}>
              {formatTime(message.timestamp)}
              {getStatusIcon()}
            </span>
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
          className="text-primary hover:underline break-all"
        >
          {part}
        </a>
      )
    }
    return part
  })
}
