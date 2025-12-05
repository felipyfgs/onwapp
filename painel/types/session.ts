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
  status: 'disconnected' | 'connecting' | 'connected'
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
