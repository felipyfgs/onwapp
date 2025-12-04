export type SessionStatusType = 'connected' | 'disconnected' | 'qr_pending' | 'connecting'

export interface SessionStats {
  messages: number
  chats: number
  contacts: number
  groups: number
}

export interface Session {
  id: string
  name: string
  status: SessionStatusType
  phone?: string
  deviceJid?: string
  apiKey?: string
  profilePicture?: string
  pushName?: string
  stats?: SessionStats
  createdAt?: string
  updatedAt?: string
}
