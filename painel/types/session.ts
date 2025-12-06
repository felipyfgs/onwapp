export type SessionStatus = 'disconnected' | 'connecting' | 'connected'

export interface SessionStats {
  messages: number
  chats: number
  contacts: number
  groups: number
}

export interface Session {
  id: string
  session: string
  deviceJid?: string
  phone?: string
  status: SessionStatus
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

export interface QRResponse {
  qr?: string
  status: string
}

export interface MessageResponse {
  message: string
  status?: string
}

export interface WebhookConfig {
  url: string
  events?: string[]
  enabled?: boolean
}

export interface WebhookResponse {
  url: string
  events: string[]
  enabled: boolean
}

export interface APIHealthResponse {
  status: 'healthy' | 'degraded'
  version: string
  database: 'connected' | 'disconnected'
  time: string
}

export interface PairPhoneRequest {
  phone: string
}

export interface SessionStatusResponse {
  session: string
  status: SessionStatus
  phone?: string
  pushName?: string
  deviceJid?: string
}
