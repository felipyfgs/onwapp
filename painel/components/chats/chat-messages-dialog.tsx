"use client"

import { useEffect, useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Check, CheckCheck, Image, Video, FileText, Mic } from "lucide-react"
import { Chat, ChatMessage, getChatMessages } from "@/lib/api/chats"

interface ChatMessagesDialogProps {
  chat: Chat | null
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getDisplayName(chat: Chat) {
  return chat.contactName || chat.name || formatJid(chat.jid)
}

function formatJid(jid: string) {
  if (jid.includes("@g.us")) return "Grupo"
  const phone = jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
  return `+${phone}`
}

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoje"
  if (diffDays === 1) return "Ontem"
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function MessageStatus({ status }: { status?: string }) {
  if (status === "read") return <CheckCheck className="h-3 w-3 text-primary" />
  if (status === "delivered") return <CheckCheck className="h-3 w-3" />
  return <Check className="h-3 w-3" />
}

function MediaIcon({ type, mediaType }: { type: string; mediaType?: string }) {
  const t = mediaType || type
  if (t === "image") return <Image className="h-4 w-4 mr-1" />
  if (t === "video") return <Video className="h-4 w-4 mr-1" />
  if (t === "audio" || t === "ptt") return <Mic className="h-4 w-4 mr-1" />
  if (t === "document") return <FileText className="h-4 w-4 mr-1" />
  return null
}

export function ChatMessagesDialog({
  chat,
  sessionId,
  open,
  onOpenChange,
}: ChatMessagesDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (!chat) return
    setLoading(true)
    try {
      const data = await getChatMessages(sessionId, chat.jid, { limit: 50 })
      setMessages(data || [])
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [sessionId, chat])

  useEffect(() => {
    if (open && chat) {
      fetchMessages()
    }
  }, [open, chat, fetchMessages])

  const getInitials = () => {
    if (!chat) return "?"
    const name = chat.contactName || chat.name || ""
    return name.slice(0, 2).toUpperCase() || "?"
  }

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: Record<string, ChatMessage[]> = {}
    msgs.forEach((msg) => {
      const date = formatDate(msg.timestamp)
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat?.profilePicture} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {chat?.isGroup ? <Users className="h-4 w-4" /> : getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base">
                {chat ? getDisplayName(chat) : "Chat"}
              </DialogTitle>
              {chat?.isGroup && (
                <p className="text-xs text-muted-foreground">Grupo</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <Skeleton className="h-12 w-48 rounded-xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma mensagem</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(messageGroups).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex justify-center mb-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      {date}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {msgs.map((msg) => (
                      <div
                        key={msg.msgId}
                        className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-xl ${
                            msg.fromMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          } ${msg.deleted ? "opacity-50 italic" : ""}`}
                        >
                          {chat?.isGroup && !msg.fromMe && msg.pushName && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {msg.pushName}
                            </p>
                          )}
                          <div className="flex items-center">
                            <MediaIcon type={msg.type} mediaType={msg.mediaType} />
                            <p className="text-sm break-words">
                              {msg.deleted
                                ? "Mensagem apagada"
                                : msg.content || `[${msg.mediaType || msg.type}]`}
                            </p>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] opacity-70">
                              {formatTime(msg.timestamp)}
                            </span>
                            {msg.fromMe && <MessageStatus status={msg.status} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
