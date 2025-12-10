"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { ChatMessage, getChatMessages } from "@/lib/api/chats"
import { db } from "@/lib/db/chats-db"

export const messagesQueryKey = (sessionId: string, chatJid: string) => 
  ["messages", sessionId, chatJid]

interface UseChatMessagesOptions {
  limit?: number
}

export function useChatMessages(
  sessionId: string,
  chatJid: string,
  options: UseChatMessagesOptions = {}
) {
  const { limit = 100 } = options

  // 1. Get cached messages from IndexedDB (instant)
  const cachedMessages = useLiveQuery(
    () => db.getMessages(sessionId, chatJid),
    [sessionId, chatJid]
  )

  // 2. TanStack Query for fresh data
  const query = useQuery({
    queryKey: messagesQueryKey(sessionId, chatJid),
    queryFn: () => getChatMessages(sessionId, chatJid, { limit }),
    initialData: cachedMessages?.length ? cachedMessages : undefined,
    staleTime: 1000 * 30, // 30 seconds
  })

  // 3. Persist to IndexedDB when data updates
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      db.saveMessages(sessionId, query.data)
    }
  }, [query.data, sessionId])

  // Sort messages by timestamp
  const sortedMessages = [...(query.data || cachedMessages || [])].sort(
    (a, b) => a.timestamp - b.timestamp
  )

  return {
    messages: sortedMessages,
    isLoading: query.isLoading && !cachedMessages?.length,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

// Utility to add a new message optimistically
export function useAddMessage() {
  const queryClient = useQueryClient()

  return (sessionId: string, chatJid: string, message: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(
      messagesQueryKey(sessionId, chatJid),
      (old) => {
        if (!old) return [message]
        // Avoid duplicates
        if (old.some((m) => m.msgId === message.msgId)) return old
        return [...old, message].sort((a, b) => a.timestamp - b.timestamp)
      }
    )
    // Also save to IndexedDB
    db.saveMessages(sessionId, [message])
  }
}

// Utility to update message status
export function useUpdateMessageStatus() {
  const queryClient = useQueryClient()

  return (
    sessionId: string,
    chatJid: string,
    messageIds: string[],
    status: string
  ) => {
    queryClient.setQueryData<ChatMessage[]>(
      messagesQueryKey(sessionId, chatJid),
      (old) => {
        if (!old) return old
        return old.map((msg) =>
          messageIds.includes(msg.msgId) ? { ...msg, status } : msg
        )
      }
    )
  }
}

// Prefetch messages for a chat
export function usePrefetchMessages() {
  const queryClient = useQueryClient()

  return async (sessionId: string, chatJid: string) => {
    await queryClient.prefetchQuery({
      queryKey: messagesQueryKey(sessionId, chatJid),
      queryFn: () => getChatMessages(sessionId, chatJid, { limit: 100 }),
      staleTime: 1000 * 30,
    })
  }
}
