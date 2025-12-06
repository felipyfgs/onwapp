import type { Chat, Message } from "@/lib/types/chat"
import { getApiConfig } from "./sessions"

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const { apiUrl, apiKey } = getApiConfig()
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: apiKey } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || error.message || `API request failed: ${response.status}`)
  }

  return response.json()
}

export async function getChats(session: string): Promise<Chat[]> {
  const response = await fetchAPI<{ chats: Chat[] }>(`/${session}/chat/list`)
  return response.chats || []
}

export async function getChatMessages(session: string, chatJid: string, limit?: number): Promise<Message[]> {
  const params = new URLSearchParams({ chatJid })
  if (limit) params.append("limit", limit.toString())
  const response = await fetchAPI<{ messages: Message[] }>(`/${session}/chat/messages?${params}`)
  return response.messages || []
}

export async function markRead(session: string, chatJid: string): Promise<void> {
  return fetchAPI<void>(`/${session}/chat/markread`, {
    method: "POST",
    body: JSON.stringify({ chatJid }),
  })
}

export async function archiveChat(session: string, chatJid: string, archive: boolean): Promise<void> {
  return fetchAPI<void>(`/${session}/chat/archive`, {
    method: "POST",
    body: JSON.stringify({ chatJid, archive }),
  })
}
