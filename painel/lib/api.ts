const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''

export interface SessionStats {
  messages: number
  chats: number
  contacts: number
  groups: number
}

export interface SessionResponse {
  id: string
  session: string
  deviceJid?: string
  phone?: string
  status: string
  apiKey?: string
  pushName?: string
  profilePicture?: string
  stats?: SessionStats
  createdAt: string
  updatedAt: string
}

export interface SessionStatus {
  status: string
  version: string
  database: string
  time: string
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Authorization': API_KEY }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getHealth(): Promise<SessionStatus> {
  return apiRequest<SessionStatus>('/health')
}

export async function getSessions(): Promise<SessionResponse[]> {
  return apiRequest<SessionResponse[]>('/sessions')
}

export async function createSession(sessionName: string, apiKey?: string): Promise<SessionResponse> {
  return apiRequest<SessionResponse>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ session: sessionName, apiKey }),
  })
}

export interface QRResponse {
  qr?: string
  status: string
}

export async function getSessionQRData(sessionName: string): Promise<QRResponse> {
  return apiRequest<QRResponse>(`/${sessionName}/qr`)
}

export async function getSessionStatus(sessionName: string): Promise<SessionStatus> {
  return apiRequest<SessionStatus>(`/${sessionName}/status`)
}

export async function connectSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/connect`, { method: 'POST' })
}

export async function disconnectSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/disconnect`, { method: 'POST' })
}

export async function deleteSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}`, { method: 'DELETE' })
}

export async function getSessionQR(sessionName: string): Promise<{ qr: string }> {
  return apiRequest<{ qr: string }>(`/${sessionName}/qr`)
}

export async function restartSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/restart`, { method: 'POST' })
}

export async function logoutSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/logout`, { method: 'POST' })
}

// Profile
export interface ProfileResponse {
  profile: {
    jid?: string
    name?: string
    status?: string
    pictureId?: string
  }
}

export async function getSessionProfile(sessionName: string): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>(`/${sessionName}/profile`)
}

// Avatar
export interface AvatarResponse {
  url: string
  id?: string
}

export async function getSessionAvatar(sessionName: string, phone: string): Promise<AvatarResponse> {
  return apiRequest<AvatarResponse>(`/${sessionName}/contact/avatar?phone=${encodeURIComponent(phone)}`)
}

// Contacts
export async function getSessionContacts(sessionName: string): Promise<Record<string, unknown>[]> {
  return apiRequest<Record<string, unknown>[]>(`/${sessionName}/contact/list`)
}

// Groups
export interface GroupResponse {
  jid: string
  name: string
  topic?: string
  participants?: string[]
}

export async function getSessionGroups(sessionName: string): Promise<GroupResponse[]> {
  return apiRequest<GroupResponse[]>(`/${sessionName}/group/list`)
}

// Chats (unread)
export interface ChatResponse {
  jid: string
  name?: string
  unreadCount?: number
  markedAsUnread?: boolean
  conversationTimestamp?: number
}

export async function getSessionChats(sessionName: string): Promise<ChatResponse[]> {
  return apiRequest<ChatResponse[]>(`/${sessionName}/history/chats/unread`)
}

// Get full session data with stats
export interface SessionWithStats extends SessionResponse {
  pushName?: string
  profilePicture?: string
  stats: {
    messages: number
    chats: number
    contacts: number
    groups: number
  }
}

export async function getSessionWithStats(sessionName: string, phone?: string): Promise<Partial<SessionWithStats>> {
  const result: Partial<SessionWithStats> = {
    stats: { messages: 0, chats: 0, contacts: 0, groups: 0 }
  }

  try {
    // Get profile (push name)
    const profile = await getSessionProfile(sessionName)
    result.pushName = profile.profile?.name
  } catch {
    // Ignore errors
  }

  try {
    // Get avatar
    if (phone) {
      const avatar = await getSessionAvatar(sessionName, phone)
      result.profilePicture = avatar.url
    }
  } catch {
    // Ignore errors
  }

  try {
    // Get contacts count
    const contacts = await getSessionContacts(sessionName)
    if (result.stats) {
      result.stats.contacts = Object.keys(contacts).length
    }
  } catch {
    // Ignore errors
  }

  try {
    // Get groups count
    const groups = await getSessionGroups(sessionName)
    if (result.stats) {
      result.stats.groups = groups.length
    }
  } catch {
    // Ignore errors
  }

  try {
    // Get chats count
    const chats = await getSessionChats(sessionName)
    if (result.stats) {
      result.stats.chats = chats.length
    }
  } catch {
    // Ignore errors
  }

  return result
}

// ============================================================================
// WEBHOOK API
// ============================================================================

import type { WebhookConfig, WebhookEvents, ChatwootConfig, SyncStatus } from './types'

export async function getWebhook(sessionName: string): Promise<WebhookConfig> {
  return apiRequest<WebhookConfig>(`/${sessionName}/webhook`)
}

export async function setWebhook(sessionName: string, config: Partial<WebhookConfig>): Promise<WebhookConfig> {
  return apiRequest<WebhookConfig>(`/${sessionName}/webhook`, {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function deleteWebhook(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/webhook`, { method: 'DELETE' })
}

export async function getWebhookEvents(): Promise<WebhookEvents> {
  return apiRequest<WebhookEvents>('/events')
}

// ============================================================================
// CHATWOOT API
// ============================================================================

export async function getChatwootConfig(sessionName: string): Promise<ChatwootConfig> {
  return apiRequest<ChatwootConfig>(`/sessions/${sessionName}/chatwoot/find`)
}

export async function setChatwootConfig(sessionName: string, config: Partial<ChatwootConfig>): Promise<ChatwootConfig> {
  return apiRequest<ChatwootConfig>(`/sessions/${sessionName}/chatwoot/set`, {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function deleteChatwootConfig(sessionName: string): Promise<void> {
  return apiRequest(`/sessions/${sessionName}/chatwoot`, { method: 'DELETE' })
}

export async function syncChatwoot(
  sessionName: string,
  type: 'all' | 'contacts' | 'messages' = 'all',
  days?: number
): Promise<SyncStatus> {
  const endpoint = type === 'all' 
    ? `/sessions/${sessionName}/chatwoot/sync`
    : `/sessions/${sessionName}/chatwoot/sync/${type}`
  const query = days ? `?days=${days}` : ''
  return apiRequest<SyncStatus>(`${endpoint}${query}`, { method: 'POST' })
}

export async function getChatwootSyncStatus(sessionName: string): Promise<SyncStatus> {
  return apiRequest<SyncStatus>(`/sessions/${sessionName}/chatwoot/sync/status`)
}

export async function resetChatwoot(sessionName: string): Promise<{ message: string; deleted: { contacts: number; conversations: number; messages: number } }> {
  return apiRequest(`/sessions/${sessionName}/chatwoot/reset`, { method: 'POST' })
}

export async function resolveAllConversations(sessionName: string): Promise<{ message: string; resolved: number }> {
  return apiRequest(`/sessions/${sessionName}/chatwoot/resolve-all`, { method: 'POST' })
}

export async function getConversationsStats(sessionName: string): Promise<{ open: number }> {
  return apiRequest(`/sessions/${sessionName}/chatwoot/conversations/stats`)
}

export interface SyncOverview {
  whatsapp: {
    contacts: number
  }
  chatwoot: {
    contacts: {
      totalChatwoot: number
      whatsAppSynced: number
      groups: number
      private: number
      withName: number
      withoutName: number
    }
    conversations: {
      total: number
      open: number
      resolved: number
      pending: number
      groupChats: number
      privateChats: number
    }
    messages: {
      total: number
      incoming: number
      outgoing: number
    }
  }
}

export async function getSyncOverview(sessionName: string): Promise<SyncOverview> {
  return apiRequest(`/sessions/${sessionName}/chatwoot/overview`)
}
