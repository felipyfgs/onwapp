"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Chat, ChatMessage } from "@/lib/api/chats"
import { useWebSocket, WebSocketMessage } from "@/hooks/use-websocket"
import { useChats, chatsQueryKey } from "@/hooks/use-chats"
import { useAddMessage } from "@/hooks/use-chat-messages"
import { db } from "@/lib/db/chats-db"

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
  const queryClient = useQueryClient()
  const addMessage = useAddMessage()
  
  const { chats, isLoading, refetch } = useChats(sessionId)
  const [highlightChatId, setHighlightChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState<ChatMessage | null>(null)
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdate | null>(null)

  const updateChatWithMessage = useCallback((msgData: WSMessageData) => {
    // Update TanStack Query cache optimistically
    queryClient.setQueryData<Chat[]>(chatsQueryKey(sessionId), (oldChats) => {
      if (!oldChats) return oldChats

      const chatIndex = oldChats.findIndex((c) => c.jid === msgData.chatJid)
      if (chatIndex === -1) {
        // New chat - refetch
        refetch()
        return oldChats
      }

      const updatedChats = [...oldChats]
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

      // Also update IndexedDB
      db.saveChats(sessionId, updatedChats)

      return updatedChats
    })
  }, [queryClient, sessionId, refetch])

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
          
          // Add message to cache
          addMessage(sessionId, msgData.chatJid, chatMessage)
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
  }, [updateChatWithMessage, addMessage, sessionId])

  const { isConnected } = useWebSocket({
    sessionId,
    onMessage: handleWebSocketMessage,
  })

  const refreshChats = useCallback(async () => {
    await refetch()
  }, [refetch])

  return (
    <ChatsContext.Provider
      value={{
        sessionId,
        chats,
        loading: isLoading,
        isConnected,
        highlightChatId,
        newMessage,
        statusUpdate,
        refreshChats,
      }}
    >
      {children}
    </ChatsContext.Provider>
  )
}
