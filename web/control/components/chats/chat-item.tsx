"use client"

import { formatDistanceToNow } from "date-fns"
import { Archive, BellOff, CheckCheck, MoreHorizontal, Pin } from "lucide-react"

import { Chat } from "@/lib/api/chats"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatItemProps {
  chat: Chat
  onArchive?: (chat: Chat) => void
  onMarkRead?: (chat: Chat) => void
  onClick?: (chat: Chat) => void
}

function getInitials(name?: string): string {
  if (!name) return "?"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function formatTime(timestamp?: string): string {
  if (!timestamp) return ""
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return ""
  }
}

export function ChatItem({ chat, onArchive, onMarkRead, onClick }: ChatItemProps) {
  const displayName = chat.name || chat.pushName || chat.jid.split("@")[0]
  const hasUnread = chat.unreadCount > 0

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer ${hasUnread ? "bg-primary/5" : ""}`}
      onClick={() => onClick?.(chat)}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={chat.profilePictureUrl} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        {chat.isGroup && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">G</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`truncate font-medium ${hasUnread ? "font-semibold" : ""}`}>{displayName}</span>
            {chat.pinned && <Pin className="h-3 w-3 text-muted-foreground" />}
            {chat.muted && <BellOff className="h-3 w-3 text-muted-foreground" />}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(chat.lastMessageTime)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={`text-sm truncate ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}>
            {chat.lastMessage || "No messages yet"}
          </p>
          {hasUnread && (
            <Badge variant="default" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasUnread && (
            <DropdownMenuItem onClick={() => onMarkRead?.(chat)}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark as read
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onArchive?.(chat)}>
            <Archive className="mr-2 h-4 w-4" />
            {chat.archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
