"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, MoreVertical, Phone, Video, Search, Users, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChatMessageItem } from "./chat-message-item"
import { ChatInput } from "./chat-input"
import { getChatMessages, sendTextMessage, markChatRead, type Chat, type ChatMessage } from "@/lib/api/chats"
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  sessionId: string
  chat: Chat
  onBack?: () => void
}

export function ChatWindow({ sessionId, chat, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayName = chat.name || chat.jid.split('@')[0]
  const phone = chat.jid.split('@')[0]

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'instant' 
    })
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getChatMessages(sessionId, chat.jid, 100)
      // Messages come oldest first from API, we keep that order
      setMessages(data)
      setTimeout(() => scrollToBottom(false), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }, [sessionId, chat.jid, scrollToBottom])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Mark as read when opening
  useEffect(() => {
    if (chat.unreadCount && chat.unreadCount > 0 && messages.length > 0) {
      const lastMessages = messages.slice(-5).map(m => m.msgId)
      markChatRead(sessionId, phone, lastMessages).catch(() => {})
    }
  }, [sessionId, phone, chat.unreadCount, messages])

  const handleSendMessage = async (text: string) => {
    setSending(true)
    try {
      const response = await sendTextMessage(sessionId, phone, text)
      // Add optimistic message
      const newMessage: ChatMessage = {
        msgId: response.messageId,
        chatJid: chat.jid,
        timestamp: response.timestamp,
        type: 'text',
        content: text,
        fromMe: true,
        isGroup: chat.isGroup,
        status: 'sent',
      }
      setMessages(prev => [...prev, newMessage])
      setTimeout(() => scrollToBottom(), 100)
    } catch (err) {
      throw err
    } finally {
      setSending(false)
    }
  }

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    let currentDate = ''

    msgs.forEach(msg => {
      const date = new Date(msg.timestamp * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
      
      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="size-5" />
          </Button>
        )}
        
        <Avatar className="size-10">
          <AvatarFallback className={cn(
            "text-white",
            chat.isGroup ? "bg-emerald-600" : "bg-slate-400"
          )}>
            {chat.isGroup ? <Users className="size-5" /> : displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {chat.isGroup ? 'Grupo' : phone}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Search className="size-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver contato</DropdownMenuItem>
              <DropdownMenuItem>Buscar mensagens</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Silenciar</DropdownMenuItem>
              <DropdownMenuItem>Arquivar conversa</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Limpar conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages area */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 bg-muted/30"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <Skeleton className={cn("h-12 rounded-lg", i % 2 === 0 ? "w-48" : "w-36")} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Nenhuma mensagem</p>
            <p className="text-xs mt-1">Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messageGroups.map(group => (
              <div key={group.date}>
                <div className="flex justify-center mb-3">
                  <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full shadow-sm">
                    {group.date}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.messages.map(msg => (
                    <ChatMessageItem 
                      key={msg.msgId} 
                      message={msg} 
                      showSender={chat.isGroup}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={loading || sending}
      />
    </div>
  )
}
