"use client"

import { useQuery } from "@tanstack/react-query"
import { getAvatar } from "@/lib/api/contacts"
import { getPhoneFromJid } from "@/lib/utils/chat-helpers"

export function avatarQueryKey(sessionId: string, jid: string) {
  return ["avatar", sessionId, jid] as const
}

export function useAvatar(sessionId: string, jid: string | undefined) {
  return useQuery({
    queryKey: avatarQueryKey(sessionId, jid || ""),
    queryFn: async () => {
      if (!jid) return null
      const phone = getPhoneFromJid(jid)
      return getAvatar(sessionId, phone)
    },
    enabled: !!jid && !!sessionId,
    staleTime: 24 * 60 * 60 * 1000, // 24h - avatars don't change often
    gcTime: 7 * 24 * 60 * 60 * 1000, // Keep in cache for 7 days
    retry: 1, // Only retry once on failure
  })
}
