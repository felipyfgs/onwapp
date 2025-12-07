"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, MoreVertical, Search, Users, Loader2, Phone, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { getChatMessages, sendTextMessage, sendAudioMessage, markChatRead, type Chat, type ChatMessage } from "@/lib/api/chats"
import { getContactAvatarUrl } from "@/lib/api/contacts"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

interface ChatWindowProps {
  sessionId: string
  chat: Chat
  onBack?: () => void
}

export function ChatWindow({ sessionId, chat, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)

  const phone = chat.jid.split('@')[0]
  
  // Resolve display name: chat.name > pushName > phone
  const displayName = (chat.name && chat.name.trim()) 
    ? chat.name 
    : (!chat.isGroup && chat.lastMessage?.pushName) 
      ? chat.lastMessage.pushName 
      : phone

  useEffect(() => {
    if (!chat.isGroup) {
      getContactAvatarUrl(sessionId, phone).then(url => setAvatarUrl(url))
    }
  }, [sessionId, phone, chat.isGroup])

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'instant' 
    })
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setHasMore(true)
      offsetRef.current = 0
      const data = await getChatMessages(sessionId, chat.jid, PAGE_SIZE, 0)
      setMessages(data)
      if (data.length < PAGE_SIZE) setHasMore(false)
      setTimeout(() => scrollToBottom(false), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }, [sessionId, chat.jid, scrollToBottom])

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    const scrollHeightBefore = containerRef.current?.scrollHeight || 0
    
    try {
      const newOffset = offsetRef.current + PAGE_SIZE
      const older = await getChatMessages(sessionId, chat.jid, PAGE_SIZE, newOffset)
      
      if (older.length < PAGE_SIZE) setHasMore(false)
      if (older.length === 0) {
        setLoadingMore(false)
        return
      }
      
      offsetRef.current = newOffset
      setMessages(prev => [...older, ...prev])
      
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const scrollHeightAfter = containerRef.current.scrollHeight
          containerRef.current.scrollTop = scrollHeightAfter - scrollHeightBefore
        }
      })
    } catch (err) {
      console.error('Erro ao carregar mais mensagens:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [sessionId, chat.jid, loadingMore, hasMore])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreMessages()
        }
      },
      { threshold: 0.1, root: containerRef.current }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, loadMoreMessages])

  useEffect(() => {
    if (chat.unreadCount && chat.unreadCount > 0 && messages.length > 0) {
      const lastMessages = messages.slice(-5).map(m => m.msgId)
      markChatRead(sessionId, phone, lastMessages).catch(() => {})
    }
  }, [sessionId, phone, chat.unreadCount, messages])

  const handleSendMessage = async (text: string) => {
    setSending(true)
    try {
      const recipient = chat.isGroup ? chat.jid : phone
      const response = await sendTextMessage(sessionId, recipient, text, chat.isGroup)
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
    const groupMap = new Map<string, ChatMessage[]>()
    const sortedMsgs = [...msgs].sort((a, b) => a.timestamp - b.timestamp)

    sortedMsgs.forEach(msg => {
      const date = new Date(msg.timestamp * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
      
      if (!groupMap.has(date)) {
        groupMap.set(date, [])
      }
      groupMap.get(date)!.push(msg)
    })

    return Array.from(groupMap.entries()).map(([date, messages]) => ({
      date,
      messages
    }))
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-muted/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2 border-b bg-card shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden size-10">
            <ArrowLeft className="size-5" />
          </Button>
        )}
        
        <Avatar className="size-10 cursor-pointer">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className={cn(
            "text-white font-medium",
            chat.isGroup ? "bg-emerald-600" : "bg-slate-500"
          )}>
            {chat.isGroup ? <Users className="size-5" /> : displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 cursor-pointer">
          <h2 className="font-medium text-[16px] truncate leading-tight">{displayName}</h2>
          <p className="text-[13px] text-muted-foreground truncate leading-tight">
            {chat.isGroup ? 'toque para info do grupo' : 'toque para info do contato'}
          </p>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-muted-foreground size-10">
            <Video className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground size-10">
            <Phone className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground size-10">
            <Search className="size-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground size-10">
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>Dados do contato</DropdownMenuItem>
              <DropdownMenuItem>Selecionar mensagens</DropdownMenuItem>
              <DropdownMenuItem>Fechar conversa</DropdownMenuItem>
              <DropdownMenuItem>Silenciar notificacoes</DropdownMenuItem>
              <DropdownMenuItem>Mensagens temporarias</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Limpar conversa</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Apagar conversa</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages area with doodle pattern */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 md:px-4 py-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80' width='80' height='80'%3E%3Cg fill-opacity='0.03'%3E%3Cpath fill='%23888' d='M20 20h8v8h-8zM50 10h10v10H50zM10 50h10v10H10zM60 55h8v8h-8zM35 35h10v10H35zM70 25h6v6h-6zM5 70h8v8H5zM45 65h10v10H45z'/%3E%3Ccircle fill='%23888' cx='25' cy='65' r='4'/%3E%3Ccircle fill='%23888' cx='65' cy='15' r='3'/%3E%3Ccircle fill='%23888' cx='75' cy='70' r='5'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: 'hsl(var(--muted) / 0.3)',
        }}
      >
        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <Skeleton className={cn("h-10 rounded-lg", i % 2 === 0 ? "w-48" : "w-32")} />
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
          <div className="py-2">
            <div ref={topSentinelRef} className="h-1" />
            
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!hasMore && messages.length > 0 && (
              <div className="flex justify-center py-3 mb-2">
                <span className="text-xs text-muted-foreground bg-card/90 px-3 py-1.5 rounded-lg shadow-sm">
                  Inicio da conversa
                </span>
              </div>
            )}
            
            {messageGroups.map(group => (
              <div key={group.date} className="mb-2">
                <div className="flex justify-center my-3">
                  <span className="text-[12.5px] text-muted-foreground bg-card/90 px-3 py-1.5 rounded-lg shadow-sm">
                    {group.date}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {group.messages.map(msg => (
                    <ChatMessageItem 
                      key={msg.msgId} 
                      message={msg} 
                      showSender={chat.isGroup}
                      sessionId={sessionId}
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
        onSendAudio={async (blob) => {
          try {
            setSending(true)
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string
                const base64 = result.split(',')[1]
                resolve(base64)
              }
              reader.onerror = reject
            })
            reader.readAsDataURL(blob)
            const audioBase64 = await base64Promise
            
            await sendAudioMessage(sessionId, phone, audioBase64, true, blob.type)
            await loadMessages()
          } catch (err) {
            console.error('Erro ao enviar audio:', err)
            setError(err instanceof Error ? err.message : 'Erro ao enviar audio')
          } finally {
            setSending(false)
          }
        }}
        onSendFile={async (type, file) => {
          console.log('File:', type, file)
          alert(`Envio de ${type} sera implementado em breve!`)
        }}
        disabled={loading || sending}
      />
    </div>
  )
}
