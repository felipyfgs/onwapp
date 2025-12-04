export type SessionStatus = 'connected' | 'disconnected' | 'qr_pending' | 'connecting'

export interface Session {
  name: string
  status: SessionStatus
  phone?: string
  version?: string
}
