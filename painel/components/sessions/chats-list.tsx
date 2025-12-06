"use client"

import * as React from "react"
import { Archive, CheckCheck, Loader2, MessageSquare, Search, Users2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type { Chat, Message } from "@/lib/types/chat"
import { getChats, getChatMessages, markRead } from "@/lib/api/chats"

interface ChatsListProps {
  sessionId: string
}

export function ChatsList({ sessionId }: ChatsListProps) {
  const [loading, setLoading] = React.useState(true)
  const [chats, setChats] = React.useState<Chat[]>([])
  const [search, setSearch] = React.useState("")

  // Messages sheet
  const [selectedChat, setSelectedChat] = React.useState<Chat | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = React.useState(false)

  const loadChats = React.useCallback(async () => {
    try {
      const data = await getChats(sessionId)
      setChats(data)
    } catch (error) {
      console.error("Failed to load chats:", error)
      toast.error("Erro ao carregar conversas")
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadChats()
  }, [loadChats])

  const handleOpenChat = async (chat: Chat) => {
    setSelectedChat(chat)
    setSheetOpen(true)
    setLoadingMessages(true)
    setMessages([])

    try {
      const msgs = await getChatMessages(sessionId, chat.jid, 50)
      setMessages(msgs)

      if (chat.unreadCount > 0) {
        await markRead(sessionId, chat.jid).catch(() => {})
        loadChats()
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
      toast.error("Erro ao carregar mensagens")
    } finally {
      setLoadingMessages(false)
    }
  }

  const filteredChats = chats.filter((c) => {
    const searchLower = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(searchLower) ||
      c.pushName?.toLowerCase().includes(searchLower) ||
      c.jid?.toLowerCase().includes(searchLower)
    )
  })

  const getDisplayName = (chat: Chat) => {
    return chat.name || chat.pushName || chat.jid?.split("@")[0] || "Sem nome"
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ""
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR })
    } catch {
      return ""
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Conversas</CardTitle>
          </div>
          <CardDescription>{chats.length} conversas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma conversa encontrada
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.jid}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleOpenChat(chat)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {chat.isGroup ? (
                          <Users2 className="h-5 w-5" />
                        ) : (
                          getDisplayName(chat).charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{getDisplayName(chat)}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage || "Sem mensagens"}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 bg-emerald-600">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {chat.archived && (
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedChat ? getDisplayName(selectedChat) : ""}</SheetTitle>
            <SheetDescription>
              {selectedChat?.isGroup ? "Grupo" : "Conversa individual"}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-150px)] mt-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma mensagem
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.isFromMe
                          ? "bg-emerald-600 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {!msg.isFromMe && msg.pushName && (
                        <p className="text-xs font-medium mb-1 text-emerald-600">
                          {msg.pushName}
                        </p>
                      )}
                      {msg.mediaType && (
                        <Badge variant="outline" className="mb-2">
                          {msg.mediaType}
                        </Badge>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.text || msg.caption || "[Mídia]"}
                      </p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        msg.isFromMe ? "text-white/70" : "text-muted-foreground"
                      }`}>
                        <span className="text-xs">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.isFromMe && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
