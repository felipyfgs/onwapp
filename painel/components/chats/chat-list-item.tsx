"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Pin, Archive, Check, CheckCheck } from "lucide-react"
import { Chat } from "@/lib/api/chats"

interface ChatListItemProps {
  chat: Chat
  onClick: () => void
}

function getInitials(chat: Chat) {
  const name = chat.contactName || chat.name || ""
  return name.slice(0, 2).toUpperCase() || "?"
}

function getDisplayName(chat: Chat) {
  return chat.contactName || chat.name || formatJid(chat.jid)
}

function formatJid(jid: string) {
  if (jid.includes("@g.us")) {
    return "Grupo"
  }
  const phone = jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
  return `+${phone}`
}

function formatTime(timestamp?: number) {
  if (!timestamp) return ""
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  } else if (diffDays === 1) {
    return "Ontem"
  } else if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "short" })
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function getMessagePreview(chat: Chat) {
  if (!chat.lastMessage) return ""
  
  const msg = chat.lastMessage
  if (msg.type === "image" || msg.mediaType === "image") return "Foto"
  if (msg.type === "video" || msg.mediaType === "video") return "Vídeo"
  if (msg.type === "audio" || msg.mediaType === "audio") return "Áudio"
  if (msg.type === "document" || msg.mediaType === "document") return "Documento"
  if (msg.type === "sticker") return "Figurinha"
  if (msg.type === "location") return "Localização"
  
  return msg.content || ""
}

function getMessageStatus(chat: Chat) {
  if (!chat.lastMessage?.fromMe) return null
  const status = chat.lastMessage.status
  
  if (status === "read") return <CheckCheck className="h-3.5 w-3.5 text-primary" />
  if (status === "delivered") return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
  return <Check className="h-3.5 w-3.5 text-muted-foreground" />
}

export function ChatListItem({ chat, onClick }: ChatListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={chat.profilePicture} alt={getDisplayName(chat)} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {chat.isGroup ? <Users className="h-5 w-5" /> : getInitials(chat)}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {chat.pinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
            <span className="font-medium truncate">{getDisplayName(chat)}</span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTime(chat.lastMessage?.timestamp || chat.conversationTimestamp)}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0 text-sm text-muted-foreground">
            {getMessageStatus(chat)}
            <span className="truncate">{getMessagePreview(chat)}</span>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {chat.archived && <Archive className="h-3.5 w-3.5 text-muted-foreground" />}
            {(chat.unreadCount && chat.unreadCount > 0) || chat.markedAsUnread ? (
              <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                {chat.unreadCount || ""}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}
