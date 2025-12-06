export type SessionStatus = "connected" | "connecting" | "disconnected"

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

export interface QRCodeResponse {
  qr?: string
  status: string
  message?: string
}

export interface ConnectResponse {
  message: string
  status: string
  qr?: string
}

export interface MessageResponse {
  message: string
  status?: string
}

export interface PairPhoneResponse {
  code: string
}
