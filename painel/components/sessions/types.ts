export type SessionStatus = 'connected' | 'disconnected' | 'connecting'

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

export type StatusFilter = 'all' | SessionStatus
