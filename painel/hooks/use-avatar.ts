"use client"

import { useQuery } from "@tanstack/react-query"
import { useLiveQuery } from "dexie-react-hooks"
import { getAvatar } from "@/lib/api/contacts"
import { getPhoneFromJid } from "@/lib/utils/chat-helpers"
import { db } from "@/lib/db/chats-db"

const AVATAR_CACHE_MAX_AGE = 60 * 60 * 1000 // 1 hour

export function avatarQueryKey(sessionId: string, jid: string) {
  return ["avatar", sessionId, jid] as const
}

export function useAvatar(sessionId: string, jid: string | undefined) {
  // 1. Get cached avatar from IndexedDB (instant, reactive)
  const cached = useLiveQuery(
    () => (jid && sessionId ? db.getAvatar(sessionId, jid) : undefined),
    [sessionId, jid]
  )

  const isFresh = cached ? db.isAvatarFresh(cached, AVATAR_CACHE_MAX_AGE) : false

  // 2. Fetch from API only if cache is stale or missing
  const query = useQuery({
    queryKey: avatarQueryKey(sessionId, jid || ""),
    queryFn: async () => {
      if (!jid) return null
      const phone = getPhoneFromJid(jid)
      const url = await getAvatar(sessionId, phone)
      // Save to IndexedDB for persistence
      await db.saveAvatar(sessionId, jid, url)
      return url
    },
    enabled: !!jid && !!sessionId && !isFresh,
    staleTime: AVATAR_CACHE_MAX_AGE,
    gcTime: 24 * 60 * 60 * 1000, // Keep in memory for 24h
    retry: 1,
  })

  return {
    data: query.data ?? cached?.avatarUrl ?? null,
    isLoading: cached === undefined && query.isLoading,
    error: query.error,
  }
}
