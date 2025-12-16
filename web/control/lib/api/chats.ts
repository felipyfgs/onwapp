import { apiClient, ApiResponse } from "./client"

export interface Chat {
  jid: string
  name?: string
  pushName?: string
  isGroup: boolean
  unreadCount: number
  lastMessageTime?: string
  lastMessage?: string
  archived: boolean
  pinned: boolean
  muted: boolean
  profilePictureUrl?: string
}

export interface ChatMessage {
  id: string
  chatJid: string
  senderJid: string
  content: string
  type: string
  mediaType?: string
  timestamp: string
  fromMe: boolean
  status: string
  quotedId?: string
}

export interface ChatInfo {
  jid: string
  name?: string
  pushName?: string
  isGroup: boolean
  unreadCount: number
  archived: boolean
  pinned: boolean
  muted: boolean
  ephemeralExpiration?: number
}

export interface GetChatsParams {
  limit?: number
  offset?: number
}

export interface GetMessagesParams {
  limit?: number
  before?: string
}

export async function getChats(
  sessionId: string,
  params?: GetChatsParams
): Promise<ApiResponse<Chat[]>> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set("limit", params.limit.toString())
  if (params?.offset) searchParams.set("offset", params.offset.toString())
  const query = searchParams.toString()
  return apiClient<Chat[]>(`/sessions/${sessionId}/chat/list${query ? `?${query}` : ""}`)
}

export async function getChatMessages(
  sessionId: string,
  chatJid: string,
  params?: GetMessagesParams
): Promise<ApiResponse<ChatMessage[]>> {
  const searchParams = new URLSearchParams()
  searchParams.set("jid", chatJid)
  if (params?.limit) searchParams.set("limit", params.limit.toString())
  if (params?.before) searchParams.set("before", params.before)
  return apiClient<ChatMessage[]>(`/sessions/${sessionId}/chat/messages?${searchParams.toString()}`)
}

export async function getChatInfo(
  sessionId: string,
  chatJid: string
): Promise<ApiResponse<ChatInfo>> {
  return apiClient<ChatInfo>(`/sessions/${sessionId}/chat/info?jid=${chatJid}`)
}

export async function markChatRead(
  sessionId: string,
  chatJid: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chat/markread`, {
    method: "POST",
    body: JSON.stringify({ jid: chatJid }),
  })
}

export async function markChatUnread(
  sessionId: string,
  chatJid: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chat/unread`, {
    method: "POST",
    body: JSON.stringify({ jid: chatJid }),
  })
}

export async function archiveChat(
  sessionId: string,
  chatJid: string,
  archive: boolean
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chat/archive`, {
    method: "POST",
    body: JSON.stringify({ jid: chatJid, archive }),
  })
}

export async function setDisappearing(
  sessionId: string,
  chatJid: string,
  expiration: number
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chat/disappearing`, {
    method: "POST",
    body: JSON.stringify({ jid: chatJid, expiration }),
  })
}
