"use client"

import { useState, useEffect } from "react"
import { Users, User, Check, CheckCheck, Clock, Archive, Pin, BellOff, Image, Mic, Video, FileText, MapPin, Contact2, Sticker } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { type Chat } from "@/lib/api/chats"
import { getContactAvatarUrl } from "@/lib/api/contacts"

interface ChatListItemProps {
  chat: Chat
  sessionId?: string
  selected?: boolean
  onClick?: () => void
}

// Resolve display name with fallback chain
// Priority: chat.name > contactName (from WhatsApp) > pushName > phone/groupId
function getDisplayName(chat: Chat): string {
  const phone = chat.jid.split('@')[0]
  
  // 1. Use chat name if available and not empty (from history sync / saved contact)
  if (chat.name && chat.name.trim() && chat.name.trim() !== phone) {
    return chat.name
  }
  
  // 2. Use contactName from WhatsApp (server-side, same priority as Chatwoot)
  // Works for both contacts (from ContactStore) and groups (from GetGroupInfo)
  if (chat.contactName && chat.contactName.trim()) {
    return chat.contactName
  }
  
  // 3. For private chats, try pushName from last message ONLY if it's a received message
  if (!chat.isGroup && !chat.lastMessage?.fromMe && chat.lastMessage?.pushName && chat.lastMessage.pushName.trim()) {
    return chat.lastMessage.pushName
  }
  
  // 4. Fallback to phone number or group ID
  return phone
}

export function ChatListItem({ chat, sessionId, selected, onClick }: ChatListItemProps) {
  const lastMsg = chat.lastMessage
  const displayName = getDisplayName(chat)
  const hasUnread = (chat.unreadCount && chat.unreadCount > 0) || chat.markedAsUnread
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId && !chat.isGroup) {
      const phone = chat.jid.split('@')[0]
      getContactAvatarUrl(sessionId, phone).then(url => setAvatarUrl(url))
    }
  }, [sessionId, chat.jid, chat.isGroup])

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
    
    if (lastMsg.mediaType || lastMsg.type !== 'text') {
      const type = lastMsg.mediaType || lastMsg.type
      switch (type) {
        case 'image':
          return { icon: <Image className="size-4 shrink-0" />, text: 'Foto' }
        case 'video':
          return { icon: <Video className="size-4 shrink-0" />, text: 'Video' }
        case 'audio':
        case 'ptt':
          return { icon: <Mic className="size-4 shrink-0" />, text: 'Audio' }
        case 'document':
          return { icon: <FileText className="size-4 shrink-0" />, text: 'Documento' }
        case 'sticker':
          return { icon: <Sticker className="size-4 shrink-0" />, text: 'Figurinha' }
        case 'location':
          return { icon: <MapPin className="size-4 shrink-0" />, text: 'Localizacao' }
        case 'contact':
        case 'vcard':
          return { icon: <Contact2 className="size-4 shrink-0" />, text: 'Contato' }
      }
    }
    
    return { text: lastMsg.content || '' }
  }

  const getStatusIcon = () => {
    if (!lastMsg?.fromMe || !lastMsg.status) return null
    switch (lastMsg.status) {
      case 'pending': return <Clock className="size-[18px] text-muted-foreground shrink-0" />
      case 'sent': return <Check className="size-[18px] text-muted-foreground shrink-0" />
      case 'delivered': return <CheckCheck className="size-[18px] text-muted-foreground shrink-0" />
      case 'read': return <CheckCheck className="size-[18px] text-sky-400 shrink-0" />
      default: return null
    }
  }

  const preview = getMessagePreview()
  const previewContent = typeof preview === 'string' ? preview : preview

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
        "flex items-center gap-3 px-3 py-[10px] cursor-pointer transition-colors",
        selected ? "bg-muted" : "hover:bg-muted/50",
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <Avatar className="size-[49px] shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback className={cn(
          "text-white text-lg font-medium",
          chat.isGroup ? "bg-emerald-600" : "bg-slate-500"
        )}>
          {chat.isGroup ? (
            <Users className="size-6" />
          ) : (
            displayName[0]?.toUpperCase() || <User className="size-6" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 border-b border-border/50 py-[2px] -my-[10px] h-[72px] flex flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "truncate text-[17px] leading-[21px]",
            hasUnread ? "font-medium" : "font-normal"
          )}>
            {displayName}
          </span>
          <span className={cn(
            "text-[12px] shrink-0",
            hasUnread ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {formatTime(lastMsg?.timestamp || chat.conversationTimestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-[2px]">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {getStatusIcon()}
            {typeof previewContent !== 'string' && previewContent.icon && (
              <span className="text-muted-foreground">{previewContent.icon}</span>
            )}
            <p className={cn(
              "text-[14px] leading-[20px] truncate",
              hasUnread ? "text-foreground" : "text-muted-foreground"
            )}>
              {senderPrefix && <span>{senderPrefix}: </span>}
              {typeof previewContent === 'string' ? previewContent : previewContent.text}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {chat.pinned && <Pin className="size-[18px] text-muted-foreground rotate-45" />}
            {chat.muted && <BellOff className="size-[18px] text-muted-foreground" />}
            {chat.archived && <Archive className="size-[18px] text-muted-foreground" />}
            {hasUnread && (
              <span className={cn(
                "flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[12px] font-medium ml-1",
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
