"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, CheckCheck, Clock, Image as ImageIcon, Video, Mic, FileText, MapPin, Contact2, Sticker, Download, ExternalLink, Reply, Pencil, Trash2, ChevronDown, Copy, Ban, Loader2 } from "lucide-react"
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
import { retryMediaDownload } from "@/lib/api/media"
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
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [stickerError, setStickerError] = useState(false)
  const [retryingMedia, setRetryingMedia] = useState<string | null>(null)
  const isMe = message.fromMe
  const isTextMessage = message.type === 'text' || (!message.mediaType && !!message.content)

  const handleRetryMedia = async (mediaType: string) => {
    if (!message.msgId || !sessionId) return
    
    setRetryingMedia(mediaType)
    try {
      await retryMediaDownload(sessionId, message.msgId)
      
      // Reset error state after successful retry initiation
      setTimeout(() => {
        switch (mediaType) {
          case 'image':
            setImageError(false)
            break
          case 'video':
            setVideoError(false)
            break
          case 'sticker':
            setStickerError(false)
            break
        }
        setRetryingMedia(null)
      }, 2000) // Wait 2s before trying to reload
    } catch (error) {
      console.error('Failed to retry media:', error)
      setRetryingMedia(null)
    }
  }

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
    // Use proxy for media URLs to avoid CORS
    return `/api/proxy/public/${sessionId}/media/stream?messageId=${msgId}`
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
          {imageUrl && !imageError ? (
            <>
              <div 
                className="relative cursor-pointer rounded overflow-hidden"
                onClick={() => !imageError && setImageViewerOpen(true)}
              >
                <Image 
                  src={imageUrl} 
                  alt="Imagem" 
                  width={330}
                  height={330}
                  className="max-w-[330px] max-h-[330px] w-auto h-auto rounded bg-muted/50 object-contain"
                  unoptimized
                  onError={() => setImageError(true)}
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
            <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                  {retryingMedia === 'image' ? (
                    <Loader2 className="size-6 text-primary animate-spin" />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground/70" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Foto</p>
                  <p className="text-xs text-muted-foreground">
                    {retryingMedia === 'image' 
                      ? 'Tentando baixar...'
                      : imageError 
                        ? 'Não foi possível carregar' 
                        : 'Imagem não disponível'}
                  </p>
                </div>
              </div>
              {imageError && imageUrl && !retryingMedia && (
                <button
                  onClick={() => handleRetryMedia('image')}
                  className="text-xs text-primary hover:underline text-left font-medium"
                >
                  Tentar baixar do WhatsApp
                </button>
              )}
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
          {videoUrl && !videoError ? (
            <video 
              src={videoUrl} 
              controls 
              className="max-w-[330px] max-h-[330px] w-auto h-auto rounded bg-muted/50"
              preload="metadata"
              poster=""
              onError={() => setVideoError(true)}
            />
          ) : (
            <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                  {retryingMedia === 'video' ? (
                    <Loader2 className="size-6 text-primary animate-spin" />
                  ) : (
                    <Video className="size-6 text-muted-foreground/70" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Vídeo</p>
                  <p className="text-xs text-muted-foreground">
                    {retryingMedia === 'video'
                      ? 'Tentando baixar...'
                      : videoError 
                        ? 'Não foi possível carregar' 
                        : 'Vídeo não disponível'}
                  </p>
                </div>
              </div>
              {videoError && videoUrl && !retryingMedia && (
                <button
                  onClick={() => handleRetryMedia('video')}
                  className="text-xs text-primary hover:underline text-left font-medium"
                >
                  Tentar baixar do WhatsApp
                </button>
              )}
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
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 min-w-[200px]">
          <div className="size-10 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
            <Mic className="size-5 text-muted-foreground/70" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {type === 'ptt' ? 'Mensagem de voz' : 'Áudio'}
            </p>
            <p className="text-xs text-muted-foreground">Mídia não disponível</p>
          </div>
        </div>
      )
    }

    if (type === 'document') {
      const docUrl = getMediaUrl(message.msgId)
      return (
        <div 
          className="flex items-center gap-3 p-3 rounded-lg min-w-[240px]"
          style={{
            backgroundColor: isMe ? 'oklch(0.30 0.08 165 / 0.3)' : 'oklch(0.30 0.02 270 / 0.5)',
            border: isMe ? '1px solid oklch(0.40 0.08 165 / 0.3)' : '1px solid oklch(0.35 0.02 270 / 0.4)',
          }}
        >
          <div 
            className="size-12 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: isMe ? 'oklch(0.40 0.08 165 / 0.4)' : 'oklch(0.35 0.02 270 / 0.6)',
            }}
          >
            <FileText 
              className="size-6" 
              style={{ color: isMe ? 'oklch(0.85 0.01 165)' : 'oklch(0.75 0.01 270)' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p 
              className="text-sm font-medium truncate"
              style={{ color: isMe ? 'oklch(0.95 0.01 165)' : 'oklch(0.90 0.01 270)' }}
            >
              {message.content || 'Documento'}
            </p>
            <p 
              className="text-xs"
              style={{ color: isMe ? 'oklch(0.80 0.01 165 / 0.7)' : 'oklch(0.75 0.01 270 / 0.8)' }}
            >
              {docUrl ? 'Clique para baixar' : 'Documento não disponível'}
            </p>
          </div>
          {docUrl && (
            <a 
              href={docUrl} 
              download 
              className="shrink-0 p-2 rounded-full transition-colors hover:brightness-110"
              title="Baixar documento"
              style={{
                backgroundColor: isMe ? 'oklch(0.40 0.08 165 / 0.3)' : 'oklch(0.35 0.02 270 / 0.4)',
              }}
            >
              <Download 
                className="size-5"
                style={{ color: isMe ? 'oklch(0.85 0.01 165)' : 'oklch(0.75 0.01 270)' }}
              />
            </a>
          )}
        </div>
      )
    }

    if (type === 'sticker') {
      const stickerUrl = getMediaUrl(message.msgId)
      
      return stickerUrl && !stickerError ? (
        <Image 
          src={stickerUrl} 
          alt="Sticker" 
          width={150} 
          height={150} 
          className="size-[150px] object-contain bg-transparent" 
          unoptimized 
          onError={() => setStickerError(true)}
        />
      ) : (
        <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
              {retryingMedia === 'sticker' ? (
                <Loader2 className="size-5 text-primary animate-spin" />
              ) : (
                <Sticker className="size-5 text-muted-foreground/70" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Figurinha</p>
              <p className="text-xs text-muted-foreground">
                {retryingMedia === 'sticker'
                  ? 'Tentando baixar...'
                  : stickerError 
                    ? 'Não foi possível carregar' 
                    : 'Figurinha não disponível'}
              </p>
            </div>
          </div>
          {stickerError && stickerUrl && !retryingMedia && (
            <button
              onClick={() => handleRetryMedia('sticker')}
              className="text-xs text-primary hover:underline text-left font-medium"
            >
              Tentar baixar do WhatsApp
            </button>
          )}
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
        <span className="text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm bg-secondary/80 text-secondary-foreground">
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
            "relative rounded-lg shadow-sm max-w-[85%] sm:max-w-[75%] md:max-w-[65%]",
            isMe ? "bg-primary/50 text-primary-foreground/70" : "bg-card/50 text-muted-foreground border border-border/50"
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
          "relative group rounded-lg shadow-md",
          "max-w-[85%] sm:max-w-[75%] md:max-w-[65%]",
          isMe ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border border-border"
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
                  isMe ? "bg-primary-foreground/10 border-primary-foreground/50" : "bg-secondary border-primary"
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
