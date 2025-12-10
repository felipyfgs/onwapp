"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { Chat, ChatMessage, getChats } from "@/lib/api/chats"
import { useWebSocket, WebSocketMessage } from "@/hooks/use-websocket"

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

interface StatusUpdate {
  messageIds: string[]
  status: string
}

interface ChatsContextValue {
  sessionId: string
  chats: Chat[]
  loading: boolean
  isConnected: boolean
  highlightChatId: string | null
  newMessage: ChatMessage | null
  statusUpdate: StatusUpdate | null
  refreshChats: () => Promise<void>
}

const ChatsContext = createContext<ChatsContextValue | null>(null)

export function useChatsContext() {
  const context = useContext(ChatsContext)
  if (!context) {
    throw new Error("useChatsContext must be used within ChatsProvider")
  }
  return context
}

interface ChatsProviderProps {
  sessionId: string
  children: ReactNode
}

export function ChatsProvider({ sessionId, children }: ChatsProviderProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [highlightChatId, setHighlightChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState<ChatMessage | null>(null)
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdate | null>(null)

  const fetchChats = useCallback(async () => {
    try {
      const data = await getChats(sessionId)
      setChats(data || [])
    } catch (error) {
      console.error("Failed to fetch chats:", error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const updateChatWithMessage = useCallback((msgData: WSMessageData) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c.jid === msgData.chatJid)
      if (chatIndex === -1) {
        fetchChats()
        return prevChats
      }

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
        if (msgData) {
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
          setNewMessage(chatMessage)
          updateChatWithMessage(msgData)
        }

        if (msgData?.chatJid) {
          setHighlightChatId(msgData.chatJid)
          setTimeout(() => setHighlightChatId(null), 2000)
        }
        break
      }

      case "message.status": {
        const statusData = message.data as WSStatusData
        if (statusData?.messageIds) {
          setStatusUpdate({ messageIds: statusData.messageIds, status: statusData.status })
        }
        break
      }
    }
  }, [updateChatWithMessage])

  const { isConnected } = useWebSocket({
    sessionId,
    onMessage: handleWebSocketMessage,
  })

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  return (
    <ChatsContext.Provider
      value={{
        sessionId,
        chats,
        loading,
        isConnected,
        highlightChatId,
        newMessage,
        statusUpdate,
        refreshChats: fetchChats,
      }}
    >
      {children}
    </ChatsContext.Provider>
  )
}
