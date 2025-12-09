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
  stats?: SessionStats
  createdAt: string
  updatedAt: string
}

export interface CreateSessionRequest {
  session: string
  apiKey?: string
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
