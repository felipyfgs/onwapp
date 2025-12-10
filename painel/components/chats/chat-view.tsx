"use client"

import { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react"
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
  newMessage?: ChatMessage | null
}

export interface ChatViewRef {
  addMessage: (message: ChatMessage) => void
  updateMessageStatus: (messageIds: string[], status: string) => void
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

export const ChatView = forwardRef<ChatViewRef, ChatViewProps>(function ChatView(
  { chat, sessionId, onBack, newMessage },
  ref
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // Handle new message from WebSocket
  useEffect(() => {
    if (newMessage && newMessage.chatJid === chat.jid) {
      setMessages((prev) => {
        if (prev.some((m) => m.msgId === newMessage.msgId)) return prev
        return [...prev, newMessage].sort((a, b) => a.timestamp - b.timestamp)
      })
    }
  }, [newMessage, chat.jid])

  // Expose methods to parent component (for status updates)
  useImperativeHandle(ref, () => ({
    addMessage: (message: ChatMessage) => {
      if (message.chatJid !== chat.jid) return
      setMessages((prev) => {
        if (prev.some((m) => m.msgId === message.msgId)) return prev
        return [...prev, message].sort((a, b) => a.timestamp - b.timestamp)
      })
    },
    updateMessageStatus: (messageIds: string[], status: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.msgId) ? { ...msg, status } : msg
        )
      )
    },
  }), [chat.jid])

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

  // Fetch messages only when chat changes
  const prevChatJidRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevChatJidRef.current !== chat.jid) {
      prevChatJidRef.current = chat.jid
      fetchMessages()
    }
  }, [chat.jid, fetchMessages])

  // Track if user is at bottom of chat
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
    }
  }, [])

  // Scroll to bottom when new messages arrive (if user was at bottom)
  useEffect(() => {
    if (scrollRef.current && !loading) {
      // Always scroll if was at bottom OR if new message was added
      const shouldScroll = isAtBottomRef.current || messages.length > 0
      if (shouldScroll) {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        }, 50)
      }
    }
  }, [messages.length, loading])

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
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-background"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Nenhuma mensagem</p>
          </div>
        ) : (
          <div className="px-3 py-2 sm:px-4 sm:py-3">
            {messageGroups.map((group) => (
              <div key={group.date} className="mb-4">
                {/* Date separator */}
                <div className="flex justify-center mb-3 sticky top-2 z-10">
                  <span className="text-[11px] bg-muted px-3 py-1.5 rounded-lg text-muted-foreground shadow-sm">
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
      <footer className="flex items-center gap-2 px-3 py-2 bg-card border-t border-border shrink-0">
        <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 h-10 w-10 hover:text-foreground">
          <Plus className="h-6 w-6" />
        </Button>

        <div className="flex-1 flex items-center gap-1 bg-input rounded-3xl px-2 py-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0 hover:text-foreground">
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Digite uma mensagem"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 h-8 px-1 text-sm placeholder:text-muted-foreground"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
        >
          {inputValue.trim() ? (
            <Send className="h-5 w-5 text-primary" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </footer>
    </div>
  )
})
