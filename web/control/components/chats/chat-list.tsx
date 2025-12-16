"use client"

import { useEffect, useState, useMemo } from "react"
import { MessageSquare, RefreshCw } from "lucide-react"

import { Chat, getChats, markChatRead, archiveChat } from "@/lib/api/chats"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { LoadingList } from "@/components/loading-state"
import { ChatItem } from "./chat-item"

interface ChatListProps {
  sessionId: string
}

export function ChatList({ sessionId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  async function fetchChats() {
    setLoading(true)
    setError(null)
    const response = await getChats(sessionId)
    if (response.success && response.data) {
      setChats(response.data)
    } else {
      setError(response.error || "Failed to fetch chats")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchChats()
  }, [sessionId])

  async function handleMarkRead(chat: Chat) {
    const response = await markChatRead(sessionId, chat.jid)
    if (response.success) {
      setChats((prev) => prev.map((c) => (c.jid === chat.jid ? { ...c, unreadCount: 0 } : c)))
    }
  }

  async function handleArchive(chat: Chat) {
    const response = await archiveChat(sessionId, chat.jid, !chat.archived)
    if (response.success) {
      setChats((prev) => prev.map((c) => (c.jid === chat.jid ? { ...c, archived: !c.archived } : c)))
    }
  }

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats
    const searchLower = search.toLowerCase()
    return chats.filter(
      (chat) =>
        chat.name?.toLowerCase().includes(searchLower) ||
        chat.pushName?.toLowerCase().includes(searchLower) ||
        chat.jid.toLowerCase().includes(searchLower)
    )
  }, [chats, search])

  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
      return timeB - timeA
    })
  }, [filteredChats])

  if (loading) return <LoadingList count={5} />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchChats}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search chats..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Button variant="outline" size="icon" onClick={fetchChats}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {sortedChats.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={search ? "No chats found" : "No chats yet"}
          description={search ? "Try a different search term" : "Connect your session to see your chats here."}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {sortedChats.length} chat{sortedChats.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}
          </p>
          <div className="space-y-2">
            {sortedChats.map((chat) => (
              <ChatItem key={chat.jid} chat={chat} onMarkRead={handleMarkRead} onArchive={handleArchive} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
