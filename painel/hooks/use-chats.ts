"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Chat, getChats } from "@/lib/api/chats"
import { db } from "@/lib/db/chats-db"

export const chatsQueryKey = (sessionId: string) => ["chats", sessionId]

export function useChats(sessionId: string) {
  // 1. Get cached data from IndexedDB (instant)
  const cachedChats = useLiveQuery(
    () => db.getChats(sessionId),
    [sessionId]
  )

  // 2. TanStack Query with initialData from IndexedDB
  const query = useQuery({
    queryKey: chatsQueryKey(sessionId),
    queryFn: () => getChats(sessionId),
    initialData: cachedChats?.length ? cachedChats : undefined,
    staleTime: 1000 * 60, // 1 minute
  })

  // 3. Persist to IndexedDB when data updates
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      db.saveChats(sessionId, query.data)
    }
  }, [query.data, sessionId])

  return {
    chats: query.data || cachedChats || [],
    isLoading: query.isLoading && !cachedChats?.length,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

// Utility to invalidate chats cache
export function useInvalidateChats() {
  const queryClient = useQueryClient()
  
  return (sessionId: string) => {
    queryClient.invalidateQueries({ queryKey: chatsQueryKey(sessionId) })
  }
}

// Utility to update a single chat optimistically
export function useUpdateChat() {
  const queryClient = useQueryClient()

  return (sessionId: string, chatJid: string, updates: Partial<Chat>) => {
    queryClient.setQueryData<Chat[]>(chatsQueryKey(sessionId), (old) => {
      if (!old) return old
      return old.map((chat) =>
        chat.jid === chatJid ? { ...chat, ...updates } : chat
      )
    })
  }
}
