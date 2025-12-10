"use client"

import { useEffect, useState, useCallback, use, useRef } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MessageSquare, Wifi, WifiOff } from "lucide-react"
import { ChatSidebar, ChatView, ChatViewRef } from "@/components/chats"
import { Chat, ChatMessage, getChats } from "@/lib/api/chats"
import { useWebSocket, WebSocketMessage } from "@/hooks/use-websocket"

interface ChatsPageProps {
  params: Promise<{ id: string }>
}

// WebSocket message data types
interface WSMessageData {
  msgId: string
  chatJid: string
  senderJid: string
  pushName: string
  timestamp: number
  type: string
  content: string
  fromMe: boolean
  isGroup: boolean
  status: string
  mediaType?: string
  quotedId?: string
  quotedSender?: string
}

interface WSStatusData {
  chatId: string
  messageIds: string[]
  status: string
}

export default function ChatsPage({ params }: ChatsPageProps) {
  const { id } = use(params)

  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [newMessageChatId, setNewMessageChatId] = useState<string | null>(null)
  const chatViewRef = useRef<ChatViewRef>(null)

  const fetchChats = useCallback(async () => {
    try {
      const data = await getChats(id)
      setChats(data || [])
    } catch (error) {
      console.error("Failed to fetch chats:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  // Update chat list when new message arrives
  const updateChatWithMessage = useCallback((msgData: WSMessageData) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c.jid === msgData.chatJid)
      if (chatIndex === -1) {
        // New chat, fetch full list
        fetchChats()
        return prevChats
      }

      // Update existing chat's last message and move to top
      const updatedChats = [...prevChats]
      const chat = { ...updatedChats[chatIndex] }
      chat.lastMessage = {
        content: msgData.content,
        timestamp: msgData.timestamp,
        fromMe: msgData.fromMe,
        type: msgData.type,
        mediaType: msgData.mediaType,
        status: msgData.status,
        senderJid: msgData.senderJid,
        pushName: msgData.pushName,
      }
      chat.conversationTimestamp = msgData.timestamp

      // Move to top
      updatedChats.splice(chatIndex, 1)
      updatedChats.unshift(chat)

      return updatedChats
    })
  }, [fetchChats])

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    const msgData = message.data as WSMessageData

    switch (message.event) {
      case "message.received":
      case "message.sent": {
        // Add message to ChatView in real-time
        if (chatViewRef.current && msgData) {
          const chatMessage: ChatMessage = {
            msgId: msgData.msgId,
            chatJid: msgData.chatJid,
            senderJid: msgData.senderJid,
            pushName: msgData.pushName,
            timestamp: msgData.timestamp,
            type: msgData.type,
            mediaType: msgData.mediaType,
            content: msgData.content,
            fromMe: msgData.fromMe,
            isGroup: msgData.isGroup,
            quotedId: msgData.quotedId,
            quotedSender: msgData.quotedSender,
            status: msgData.status,
          }
          chatViewRef.current.addMessage(chatMessage)
        }

        // Update chat list
        if (msgData) {
          updateChatWithMessage(msgData)
        }

        // Highlight chat
        if (msgData?.chatJid) {
          setNewMessageChatId(msgData.chatJid)
          setTimeout(() => setNewMessageChatId(null), 2000)
        }
        break
      }

      case "message.status": {
        const statusData = message.data as WSStatusData
        if (chatViewRef.current && statusData?.messageIds) {
          chatViewRef.current.updateMessageStatus(statusData.messageIds, statusData.status)
        }
        break
      }
    }
  }, [updateChatWithMessage])

  const { isConnected } = useWebSocket({
    sessionId: id,
    onMessage: handleWebSocketMessage,
  })

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,0px))]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Conversas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-4 flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </header>

      {/* Main Content - Fixed height container */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1 min-h-0">
          {/* Chat List - Independent scroll */}
          <div className="w-[360px] lg:w-[400px] shrink-0 border-r border-border flex flex-col min-h-0">
            <ChatSidebar
              chats={chats}
              selectedChat={selectedChat}
              onChatSelect={setSelectedChat}
              loading={loading}
              highlightChatId={newMessageChatId}
            />
          </div>

          {/* Chat View - Independent scroll */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedChat ? (
              <ChatView ref={chatViewRef} chat={selectedChat} sessionId={id} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-background">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-medium text-foreground mb-1">OnWapp Web</h2>
                <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-1 md:hidden min-h-0">
          {selectedChat ? (
            <ChatView ref={chatViewRef} chat={selectedChat} sessionId={id} onBack={() => setSelectedChat(null)} />
          ) : (
            <ChatSidebar
              chats={chats}
              selectedChat={selectedChat}
              onChatSelect={setSelectedChat}
              loading={loading}
              highlightChatId={newMessageChatId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
