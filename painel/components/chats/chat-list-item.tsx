"use client"

import { Users, User, Check, CheckCheck, Clock, Archive, Pin, BellOff, Image, Mic, Video, FileText, MapPin, Contact2, Sticker } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Chat } from "@/lib/api/chats"

interface ChatListItemProps {
  chat: Chat
  selected?: boolean
  onClick?: () => void
}

export function ChatListItem({ chat, selected, onClick }: ChatListItemProps) {
  const displayName = chat.name || chat.jid.split('@')[0]
  const hasUnread = (chat.unreadCount && chat.unreadCount > 0) || chat.markedAsUnread
  const lastMsg = chat.lastMessage

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Ontem'
    if (days < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const getMessagePreview = () => {
    if (!lastMsg) return chat.isGroup ? 'Grupo' : ''
    
    // Media type indicators
    if (lastMsg.mediaType || lastMsg.type !== 'text') {
      const type = lastMsg.mediaType || lastMsg.type
      switch (type) {
        case 'image':
          return { icon: <Image className="size-4" />, text: 'Foto' }
        case 'video':
          return { icon: <Video className="size-4" />, text: 'Video' }
        case 'audio':
        case 'ptt':
          return { icon: <Mic className="size-4" />, text: 'Audio' }
        case 'document':
          return { icon: <FileText className="size-4" />, text: 'Documento' }
        case 'sticker':
          return { icon: <Sticker className="size-4" />, text: 'Figurinha' }
        case 'location':
          return { icon: <MapPin className="size-4" />, text: 'Localizacao' }
        case 'contact':
        case 'vcard':
          return { icon: <Contact2 className="size-4" />, text: 'Contato' }
      }
    }
    
    return { text: lastMsg.content || '' }
  }

  const getStatusIcon = () => {
    if (!lastMsg?.fromMe || !lastMsg.status) return null
    switch (lastMsg.status) {
      case 'pending': return <Clock className="size-3.5 text-muted-foreground shrink-0" />
      case 'sent': return <Check className="size-3.5 text-muted-foreground shrink-0" />
      case 'delivered': return <CheckCheck className="size-3.5 text-muted-foreground shrink-0" />
      case 'read': return <CheckCheck className="size-3.5 text-blue-500 shrink-0" />
      default: return null
    }
  }

  const preview = getMessagePreview()
  const previewContent = typeof preview === 'string' ? preview : preview

  // Get sender name for group messages
  const getSenderPrefix = () => {
    if (!chat.isGroup || !lastMsg) return null
    if (lastMsg.fromMe) return 'Voce'
    if (lastMsg.pushName) return lastMsg.pushName.split(' ')[0]
    if (lastMsg.senderJid) return lastMsg.senderJid.split('@')[0]
    return null
  }

  const senderPrefix = getSenderPrefix()

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/40",
        selected ? "bg-muted" : "hover:bg-muted/50",
        hasUnread && "bg-primary/5"
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <Avatar className="size-12 shrink-0">
        <AvatarFallback className={cn(
          "text-white text-lg font-medium",
          chat.isGroup ? "bg-emerald-600" : "bg-slate-400"
        )}>
          {chat.isGroup ? (
            <Users className="size-5" />
          ) : (
            displayName[0]?.toUpperCase() || <User className="size-5" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "truncate",
            hasUnread ? "font-semibold" : "font-medium"
          )}>
            {displayName}
          </span>
          <span className={cn(
            "text-xs shrink-0",
            hasUnread ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {formatTime(lastMsg?.timestamp || chat.conversationTimestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {getStatusIcon()}
            {typeof previewContent !== 'string' && previewContent.icon && (
              <span className="text-muted-foreground shrink-0">{previewContent.icon}</span>
            )}
            <p className={cn(
              "text-sm truncate",
              hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {senderPrefix && <span className="text-muted-foreground">{senderPrefix}: </span>}
              {typeof previewContent === 'string' ? previewContent : previewContent.text}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {chat.pinned && <Pin className="size-4 text-muted-foreground rotate-45" />}
            {chat.muted && <BellOff className="size-4 text-muted-foreground" />}
            {chat.archived && <Archive className="size-4 text-muted-foreground" />}
            {hasUnread && (
              <span className={cn(
                "flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-medium",
                chat.muted 
                  ? "bg-muted-foreground/30 text-muted-foreground" 
                  : "bg-primary text-primary-foreground"
              )}>
                {chat.unreadCount && chat.unreadCount > 99 ? '99+' : chat.unreadCount || ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
