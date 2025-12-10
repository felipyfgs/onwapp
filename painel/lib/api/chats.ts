import { api } from "./client"

export interface LastMessageInfo {
  content?: string
  timestamp: number
  fromMe: boolean
  type: string
  mediaType?: string
  status?: string
  senderJid?: string
  pushName?: string
}

export interface Chat {
  id: string
  jid: string
  name?: string
  contactName?: string
  profilePicture?: string
  unreadCount?: number
  markedAsUnread?: boolean
  ephemeralExpiration?: number
  conversationTimestamp?: number
  readOnly?: boolean
  suspended?: boolean
  locked?: boolean
  isGroup: boolean
  archived?: boolean
  pinned?: boolean
  muted?: string
  lastMessage?: LastMessageInfo
}

export interface ChatMessage {
  msgId: string
  chatJid: string
  senderJid?: string
  pushName?: string
  timestamp: number
  type: string
  mediaType?: string
  content?: string
  fromMe: boolean
  isGroup: boolean
  quotedId?: string
  quotedSender?: string
  status?: string
  deleted?: boolean
}

export async function getChats(session: string): Promise<Chat[]> {
  return api<Chat[]>(`/${session}/chat/list`)
}

export async function getChatMessages(
  session: string,
  chatId: string,
  options?: { limit?: number; offset?: number }
): Promise<ChatMessage[]> {
  const params = new URLSearchParams()
  params.set("chatId", chatId)
  if (options?.limit) params.set("limit", options.limit.toString())
  if (options?.offset) params.set("offset", options.offset.toString())
  
  return api<ChatMessage[]>(`/${session}/chat/messages?${params.toString()}`)
}

export async function markRead(session: string, chatJid: string, messageIds: string[]): Promise<void> {
  await api(`/${session}/chat/markread`, {
    method: "POST",
    body: JSON.stringify({ chatJid, messageIds }),
  })
}

export async function archiveChat(session: string, chatJid: string, archive: boolean): Promise<void> {
  await api(`/${session}/chat/archive`, {
    method: "POST",
    body: JSON.stringify({ chatJid, archive }),
  })
}

export async function markChatUnread(session: string, chatJid: string): Promise<void> {
  await api(`/${session}/chat/unread`, {
    method: "POST",
    body: JSON.stringify({ chatJid }),
  })
}
