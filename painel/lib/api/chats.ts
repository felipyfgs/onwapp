import { api, API_URL } from "./client"
import { getStoredApiKey } from "@/lib/auth"

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

// ============================================================
// SEND MESSAGES
// ============================================================

export interface SendMessageResponse {
  messageId: string
  timestamp: number
}

export async function sendTextMessage(
  session: string,
  phone: string,
  text: string
): Promise<SendMessageResponse> {
  return api<SendMessageResponse>(`/${session}/message/send/text`, {
    method: "POST",
    body: JSON.stringify({ phone, text }),
  })
}

export async function sendImageMessage(
  session: string,
  phone: string,
  image: string, // base64 or URL
  caption?: string,
  mimeType?: string
): Promise<SendMessageResponse> {
  return api<SendMessageResponse>(`/${session}/message/send/image`, {
    method: "POST",
    body: JSON.stringify({ phone, image, caption, mimeType }),
  })
}

export async function sendAudioMessage(
  session: string,
  phone: string,
  audio: string, // base64 or URL
  ptt: boolean = true // push-to-talk (voice message)
): Promise<SendMessageResponse> {
  return api<SendMessageResponse>(`/${session}/message/send/audio`, {
    method: "POST",
    body: JSON.stringify({ phone, audio, ptt }),
  })
}

export async function sendVideoMessage(
  session: string,
  phone: string,
  video: string, // base64 or URL
  caption?: string,
  mimeType?: string
): Promise<SendMessageResponse> {
  return api<SendMessageResponse>(`/${session}/message/send/video`, {
    method: "POST",
    body: JSON.stringify({ phone, video, caption, mimeType }),
  })
}

export async function sendDocumentMessage(
  session: string,
  phone: string,
  document: string, // base64 or URL
  filename?: string,
  mimeType?: string
): Promise<SendMessageResponse> {
  return api<SendMessageResponse>(`/${session}/message/send/document`, {
    method: "POST",
    body: JSON.stringify({ phone, document, filename, mimeType }),
  })
}

// Upload file helper - converts File to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:mime;base64, prefix
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Get media stream URL for a message
export function getMediaUrl(sessionId: string, messageId: string): string {
  const apiKey = getStoredApiKey()
  return `${API_URL}/${sessionId}/media/stream?messageId=${messageId}${apiKey ? `&auth=${apiKey}` : ""}`
}
