const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface Chat {
  jid: string
  name?: string
  pushName?: string
  isGroup: boolean
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  archived?: boolean
}

export interface ChatMessage {
  id: string
  chatJid: string
  senderJid?: string
  content: string
  timestamp: string
  fromMe: boolean
  type: string
  status?: string
}

async function getApiKey(): Promise<string> {
  if (typeof window !== 'undefined') {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('api_key='))
    return cookie?.split('=')[1] || ''
  }
  return ''
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = await getApiKey()
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export async function getChats(sessionId: string): Promise<Chat[]> {
  const data = await apiRequest<{ chats: Chat[] }>(`/${sessionId}/chat/list`)
  return data.chats || []
}

export async function getChatMessages(
  sessionId: string, 
  chatJid: string,
  limit?: number
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ jid: chatJid })
  if (limit) params.append('limit', limit.toString())
  
  const data = await apiRequest<{ messages: ChatMessage[] }>(
    `/${sessionId}/chat/messages?${params}`
  )
  return data.messages || []
}

export async function getChatInfo(sessionId: string, chatJid: string): Promise<Chat> {
  const params = new URLSearchParams({ jid: chatJid })
  return apiRequest<Chat>(`/${sessionId}/chat/info?${params}`)
}

export async function markChatRead(sessionId: string, chatJid: string, messageIds: string[]): Promise<void> {
  await apiRequest(`/${sessionId}/chat/markread`, {
    method: 'POST',
    body: JSON.stringify({ jid: chatJid, messageIds }),
  })
}

export async function archiveChat(sessionId: string, chatJid: string, archive: boolean): Promise<void> {
  await apiRequest(`/${sessionId}/chat/archive`, {
    method: 'POST',
    body: JSON.stringify({ jid: chatJid, archive }),
  })
}
