import { api } from "./client"

export interface SessionStats {
  messages: number
  chats: number
  contacts: number
  groups: number
}

export interface ApiSession {
  id: string
  session: string
  deviceJid?: string
  phone?: string
  status: string
  apiKey?: string
  pushName?: string
  profilePicture?: string
  about?: string
  platform?: string
  businessName?: string
  lastConnectedAt?: string
  lastDisconnectedAt?: string
  lastActivityAt?: string
  disconnectReason?: string
  syncHistory?: boolean
  historySyncStatus?: string
  stats?: SessionStats
  createdAt: string
  updatedAt: string
}

export interface CreateSessionRequest {
  session: string
  apiKey?: string
  syncHistory?: boolean
}

export async function getSessions(): Promise<ApiSession[]> {
  return api<ApiSession[]>("/sessions")
}

export async function createSession(data: CreateSessionRequest): Promise<ApiSession> {
  return api<ApiSession>("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function deleteSession(session: string): Promise<void> {
  await api(`/${session}`, { method: "DELETE" })
}

export async function connectSession(session: string): Promise<{ message: string; status?: string }> {
  return api(`/${session}/connect`, { method: "POST" })
}

export async function disconnectSession(session: string): Promise<{ message: string }> {
  return api(`/${session}/disconnect`, { method: "POST" })
}

export async function getSessionQR(session: string): Promise<{ qr?: string; status: string }> {
  return api(`/${session}/qr`)
}

export async function pairPhone(session: string, phone: string): Promise<{ code: string }> {
  return api(`/${session}/pairphone`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  })
}

export async function getSessionStatus(session: string): Promise<ApiSession> {
  return api(`/${session}/status`)
}

export async function getSessionProfile(session: string): Promise<{
  jid: string
  name: string
  status: string
  picture?: string
}> {
  return api(`/${session}/profile`)
}

export async function restartSession(session: string): Promise<{ message: string }> {
  return api(`/${session}/restart`, { method: "POST" })
}

export async function logoutSession(session: string): Promise<{ message: string }> {
  return api(`/${session}/logout`, { method: "POST" })
}

export interface ChatItem {
  jid: string
  name?: string
  contactName?: string
  profilePicture?: string
  unreadCount?: number
  lastMessage?: {
    content: string
    timestamp: number
    fromMe: boolean
  }
}

export async function getChats(session: string): Promise<ChatItem[]> {
  return api(`/${session}/chat/list`)
}

export interface ContactItem {
  jid: string
  name?: string
  phone?: string
}

export async function getContacts(session: string): Promise<ContactItem[]> {
  return api(`/${session}/contact/list`)
}

export interface GroupItem {
  jid: string
  name: string
  participantCount?: number
}

export async function getGroups(session: string): Promise<GroupItem[]> {
  return api(`/${session}/group/list`)
}

export interface WebhookConfig {
  id?: string
  sessionId: string
  url?: string
  events?: string[]
  enabled: boolean
}

export async function getWebhook(session: string): Promise<WebhookConfig | null> {
  try {
    return await api(`/${session}/webhook`)
  } catch {
    return null
  }
}
