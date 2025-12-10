"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Plus,
  Smile,
  Mic,
  Send,
  Users,
  Loader2,
} from "lucide-react"
import { Chat, ChatMessage, getChatMessages } from "@/lib/api/chats"
import { ChatMessageBubble } from "./chat-message-bubble"

interface ChatViewProps {
  chat: Chat
  sessionId: string
  onBack?: () => void
}

function getDisplayName(chat: Chat) {
  return chat.contactName || chat.name || formatJid(chat.jid)
}

function formatJid(jid: string) {
  if (jid.includes("@g.us")) return "Grupo"
  const phone = jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
  return `+${phone}`
}

function getInitials(chat: Chat) {
  const name = chat.contactName || chat.name || ""
  return name.slice(0, 2).toUpperCase() || "?"
}

function formatLastSeen(timestamp?: number) {
  if (!timestamp) return ""
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return "online"
  if (diffMins < 60) return `visto há ${diffMins} min`
  return `visto às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

function formatDateSeparator(timestamp: number) {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoje"
  if (diffDays === 1) return "Ontem"
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

interface MessageGroup {
  date: string
  messages: ChatMessage[]
}

function groupMessagesByDate(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  let currentDate = ""

  messages.forEach((msg) => {
    const dateStr = formatDateSeparator(msg.timestamp)
    if (dateStr !== currentDate) {
      currentDate = dateStr
      groups.push({ date: dateStr, messages: [msg] })
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  })

  return groups
}

export function ChatView({ chat, sessionId, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getChatMessages(sessionId, chat.jid, { limit: 100 })
      setMessages((data || []).sort((a, b) => a.timestamp - b.timestamp))
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [sessionId, chat.jid])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (scrollRef.current && !loading) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 shrink-0 bg-card border-b border-border">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={chat.profilePicture} alt={getDisplayName(chat)} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {chat.isGroup ? <Users className="h-5 w-5" /> : getInitials(chat)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate text-sm">{getDisplayName(chat)}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {chat.isGroup ? "Grupo" : formatLastSeen(chat.lastMessage?.timestamp)}
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-background">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Nenhuma mensagem</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messageGroups.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex justify-center mb-4">
                  <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                    {group.date}
                  </span>
                </div>

                {/* Messages */}
                <div className="space-y-1">
                  {group.messages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? group.messages[idx - 1] : null
                    const showSender = !prevMsg || prevMsg.senderJid !== msg.senderJid || prevMsg.fromMe !== msg.fromMe

                    return (
                      <ChatMessageBubble
                        key={msg.msgId}
                        message={msg}
                        isGroup={chat.isGroup}
                        showSender={showSender}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <footer className="flex items-center gap-2 px-4 py-3 bg-card border-t border-border shrink-0">
        <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0">
          <Plus className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center gap-2 bg-input rounded-full px-3 py-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0">
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Digite uma mensagem"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 h-7 px-0 text-sm"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0">
          {inputValue.trim() ? <Send className="h-5 w-5 text-primary" /> : <Mic className="h-5 w-5" />}
        </Button>
      </footer>
    </div>
  )
}
