"use client"

import { useState, useEffect } from "react"
import { Users, User, Check, CheckCheck, Clock, Archive, Pin, BellOff, Image, Mic, Video, FileText, MapPin, Contact } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Chat } from "@/lib/api/chats"

interface ChatListItemProps {
  chat: Chat
  sessionId: string
  selected?: boolean
  onClick?: () => void
}

export function ChatListItem({ chat, sessionId, selected, onClick }: ChatListItemProps) {
  const [avatar, setAvatar] = useState<string | null>(null)

  const displayName = chat.name || chat.pushName || chat.jid.split('@')[0]
  const phone = chat.jid.split('@')[0]

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Ontem'
    if (days < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const getMessageIcon = (msg?: string) => {
    if (!msg) return null
    if (msg.includes('[imagem]') || msg.includes('[image]')) return <Image className="size-4 text-muted-foreground" />
    if (msg.includes('[audio]') || msg.includes('[voice]')) return <Mic className="size-4 text-muted-foreground" />
    if (msg.includes('[video]')) return <Video className="size-4 text-muted-foreground" />
    if (msg.includes('[document]') || msg.includes('[arquivo]')) return <FileText className="size-4 text-muted-foreground" />
    if (msg.includes('[location]') || msg.includes('[localizacao]')) return <MapPin className="size-4 text-muted-foreground" />
    if (msg.includes('[contact]') || msg.includes('[contato]')) return <Contact className="size-4 text-muted-foreground" />
    return null
  }

  const getStatusIcon = (status?: string) => {
    if (!status) return null
    switch (status) {
      case 'sent': return <Check className="size-4 text-muted-foreground" />
      case 'delivered': return <CheckCheck className="size-4 text-muted-foreground" />
      case 'read': return <CheckCheck className="size-4 text-blue-500" />
      case 'pending': return <Clock className="size-3 text-muted-foreground" />
      default: return null
    }
  }

  const hasUnread = chat.unreadCount && chat.unreadCount > 0
  const messageIcon = getMessageIcon(chat.lastMessage)

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-border/50",
        selected ? "bg-muted" : "hover:bg-muted/50",
        hasUnread && "bg-primary/5"
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <Avatar className="size-12 shrink-0">
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback className={cn(
          "text-white text-lg",
          chat.isGroup ? "bg-emerald-600" : "bg-gray-400"
        )}>
          {chat.isGroup ? (
            <Users className="size-6" />
          ) : (
            displayName[0]?.toUpperCase() || <User className="size-6" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "font-medium truncate",
            hasUnread && "font-semibold"
          )}>
            {displayName}
          </span>
          <span className={cn(
            "text-xs shrink-0",
            hasUnread ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {formatTime(chat.lastMessageTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {chat.lastMessageFromMe && getStatusIcon(chat.lastMessageStatus)}
            {messageIcon}
            <p className={cn(
              "text-sm truncate",
              hasUnread ? "text-foreground" : "text-muted-foreground"
            )}>
              {chat.lastMessage || (chat.isGroup ? 'Grupo' : phone)}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {chat.pinned && <Pin className="size-4 text-muted-foreground rotate-45" />}
            {chat.muted && <BellOff className="size-4 text-muted-foreground" />}
            {chat.archived && <Archive className="size-4 text-muted-foreground" />}
            {hasUnread && (
              <span className={cn(
                "flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-medium",
                chat.muted 
                  ? "bg-muted-foreground/20 text-muted-foreground" 
                  : "bg-primary text-primary-foreground"
              )}>
                {chat.unreadCount! > 99 ? '99+' : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
