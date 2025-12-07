const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

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
  jid: string
  name?: string
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
    console.error(`API Error [${res.status}] ${endpoint}:`, error)
    throw new Error(error.error || `Request failed (${res.status})`)
  }

  return res.json()
}

export async function getChats(sessionId: string, limit = 100, offset = 0): Promise<Chat[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })
  return apiRequest<Chat[]>(`/${sessionId}/chat/list?${params}`)
}

export async function getChatMessages(
  sessionId: string, 
  chatId: string,
  limit = 50,
  offset = 0
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ 
    chatId,
    limit: limit.toString(),
    offset: offset.toString(),
  })
  return apiRequest<ChatMessage[]>(`/${sessionId}/chat/messages?${params}`)
}

export async function getChatInfo(sessionId: string, chatId: string): Promise<Chat> {
  const params = new URLSearchParams({ chatId })
  return apiRequest<Chat>(`/${sessionId}/chat/info?${params}`)
}

export async function markChatRead(sessionId: string, phone: string, messageIds: string[]): Promise<void> {
  await apiRequest(`/${sessionId}/chat/markread`, {
    method: 'POST',
    body: JSON.stringify({ phone, messageIds }),
  })
}

export async function markChatUnread(sessionId: string, phone: string): Promise<void> {
  await apiRequest(`/${sessionId}/chat/unread`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

export async function archiveChat(sessionId: string, phone: string, archive: boolean): Promise<void> {
  await apiRequest(`/${sessionId}/chat/archive`, {
    method: 'POST',
    body: JSON.stringify({ phone, archive }),
  })
}

export interface SendMessageResponse {
  messageId: string
  timestamp: number
}

export interface QuotedMessage {
  messageId: string
  chatJid?: string
  senderJid?: string
}

export async function sendTextMessage(
  sessionId: string, 
  phone: string, 
  text: string,
  isGroup = false,
  quoted?: QuotedMessage
): Promise<SendMessageResponse> {
  if (isGroup) {
    return apiRequest<SendMessageResponse>(`/${sessionId}/group/send/text`, {
      method: 'POST',
      body: JSON.stringify({ groupId: phone, text, quoted }),
    })
  }
  return apiRequest<SendMessageResponse>(`/${sessionId}/message/send/text`, {
    method: 'POST',
    body: JSON.stringify({ phone, text, quoted }),
  })
}

// Delete a message
export async function deleteMessage(
  sessionId: string,
  phone: string,
  messageId: string,
  forMe = false
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionId}/message/delete`, {
    method: 'POST',
    body: JSON.stringify({ phone, messageId, forMe }),
  })
}

// Edit a message (only your own messages)
export async function editMessage(
  sessionId: string,
  phone: string,
  messageId: string,
  newText: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionId}/message/edit`, {
    method: 'POST',
    body: JSON.stringify({ phone, messageId, newText }),
  })
}

// Send reaction to a message
export async function sendReaction(
  sessionId: string,
  phone: string,
  messageId: string,
  emoji: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionId}/message/react`, {
    method: 'POST',
    body: JSON.stringify({ phone, messageId, emoji }),
  })
}

export async function sendImageMessage(
  sessionId: string,
  phone: string,
  image: string,
  caption?: string,
  mimeType?: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionId}/message/send/image`, {
    method: 'POST',
    body: JSON.stringify({ phone, image, caption, mimeType }),
  })
}

export async function sendDocumentMessage(
  sessionId: string,
  phone: string,
  document: string,
  filename: string,
  caption?: string,
  mimeType?: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionId}/message/send/document`, {
    method: 'POST',
    body: JSON.stringify({ phone, document, filename, caption, mimeType }),
  })
}

export async function sendAudioMessage(
  sessionId: string,
  phone: string,
  audio: string,
  ptt?: boolean,
  mimeType?: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionId}/message/send/audio`, {
    method: 'POST',
    body: JSON.stringify({ phone, audio, ptt, mimetype: mimeType }),
  })
}


