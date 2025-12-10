"use client"

import { useState, useMemo, useRef, memo } from "react"
import Link from "next/link"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MoreVertical,
  MessageSquarePlus,
  Users,
  Pin,
  Archive,
  Check,
  CheckCheck,
} from "lucide-react"
import { Chat } from "@/lib/api/chats"
import { cn } from "@/lib/utils"
import { extractChatId } from "@/lib/utils/jid"
import { 
  getDisplayName, 
  getInitials, 
  formatChatTime, 
  getMessagePreview 
} from "@/lib/utils/chat-helpers"

interface ChatSidebarProps {
  chats: Chat[]
  selectedChat: Chat | null
  onChatSelect?: (chat: Chat) => void
  sessionId?: string
  loading?: boolean
  highlightChatId?: string | null
}

type FilterType = "all" | "unread" | "groups"

const ITEM_HEIGHT = 72

function MessageStatus({ chat }: { chat: Chat }) {
  if (!chat.lastMessage?.fromMe) return null
  const status = chat.lastMessage.status
  if (status === "read") return <CheckCheck className="h-4 w-4 text-blue-400 shrink-0" />
  if (status === "delivered") return <CheckCheck className="h-4 w-4 text-muted-foreground shrink-0" />
  return <Check className="h-4 w-4 text-muted-foreground shrink-0" />
}

function ChatListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 h-[72px]">
      <div className="h-12 w-12 rounded-full bg-muted animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}

interface ChatListItemProps {
  chat: Chat
  isSelected: boolean
  onSelect?: () => void
  href?: string
  highlight?: boolean
}

const ChatListItem = memo(function ChatListItem({ 
  chat, 
  isSelected, 
  onSelect, 
  href, 
  highlight 
}: ChatListItemProps) {
  const className = cn(
    "w-full flex items-center gap-3 px-4 h-[72px] hover:bg-accent transition-colors",
    isSelected && "bg-accent",
    highlight && "bg-primary/10 animate-pulse"
  )

  const content = (
    <>
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={chat.profilePicture} alt={getDisplayName(chat)} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {chat.isGroup ? <Users className="h-5 w-5" /> : getInitials(chat)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground truncate text-sm">
            {getDisplayName(chat)}
          </span>
          <span
            className={cn(
              "text-xs shrink-0",
              chat.unreadCount && chat.unreadCount > 0
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            {formatChatTime(chat.lastMessage?.timestamp || chat.conversationTimestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0 text-sm text-muted-foreground">
            <MessageStatus chat={chat} />
            <span className="truncate">{getMessagePreview(chat)}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {chat.pinned && <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
            {((chat.unreadCount && chat.unreadCount > 0) || chat.markedAsUnread) && (
              <Badge className="h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                {chat.unreadCount || ""}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onSelect} className={className}>
      {content}
    </button>
  )
})

export function ChatSidebar({ chats, selectedChat, onChatSelect, sessionId, loading, highlightChatId }: ChatSidebarProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const parentRef = useRef<HTMLDivElement>(null)

  const filteredChats = useMemo(() => {
    let filtered = chats

    if (search) {
      filtered = filtered.filter(
        (chat) =>
          chat.name?.toLowerCase().includes(search.toLowerCase()) ||
          chat.contactName?.toLowerCase().includes(search.toLowerCase()) ||
          chat.jid?.includes(search)
      )
    }

    if (filter === "unread") {
      filtered = filtered.filter((c) => (c.unreadCount && c.unreadCount > 0) || c.markedAsUnread)
    } else if (filter === "groups") {
      filtered = filtered.filter((c) => c.isGroup)
    }

    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      const tsA = a.lastMessage?.timestamp || a.conversationTimestamp || 0
      const tsB = b.lastMessage?.timestamp || b.conversationTimestamp || 0
      return tsB - tsA
    })
  }, [chats, search, filter])

  const archivedCount = chats.filter((c) => c.archived).length
  const nonArchivedChats = filteredChats.filter((c) => !c.archived)

  const virtualizer = useVirtualizer({
    count: nonArchivedChats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  })

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header - Fixed */}
      <header className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Conversas</h1>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Search - Fixed */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar conversa"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-0 rounded-lg h-9 text-sm"
          />
        </div>
      </div>

      {/* Filters - Fixed */}
      <div className="flex gap-2 px-3 pb-2 shrink-0">
        {(["all", "unread", "groups"] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(f)}
            className="rounded-full text-xs h-7 px-3 shrink-0"
          >
            {f === "all" ? "Tudo" : f === "unread" ? "Não lidas" : "Grupos"}
          </Button>
        ))}
      </div>

      {/* Chat List - Virtualized Scrollable */}
      <div ref={parentRef} className="flex-1 overflow-y-auto min-h-0">
        {/* Archived */}
        {archivedCount > 0 && filter === "all" && (
          <button className="w-full flex items-center gap-3 px-4 h-[72px] hover:bg-accent transition-colors">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Archive className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="font-medium text-foreground">Arquivadas</span>
            <span className="ml-auto text-xs text-muted-foreground">{archivedCount}</span>
          </button>
        )}

        {loading ? (
          [...Array(8)].map((_, i) => <ChatListItemSkeleton key={i} />)
        ) : nonArchivedChats.length === 0 ? (
          <div className="flex items-center justify-center py-12 px-4">
            <p className="text-muted-foreground text-sm">
              {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa"}
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const chat = nonArchivedChats[virtualRow.index]
              return (
                <div
                  key={chat.jid}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ChatListItem
                    chat={chat}
                    isSelected={selectedChat?.jid === chat.jid}
                    href={sessionId ? `/sessions/${sessionId}/chats/${extractChatId(chat.jid)}` : undefined}
                    onSelect={onChatSelect ? () => onChatSelect(chat) : undefined}
                    highlight={highlightChatId === chat.jid}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
