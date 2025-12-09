import { useApi } from '~/composables/useApi'

export interface Session {
  session_id: string
  status: 'connected' | 'disconnected' | 'connecting' | 'qr' | 'pairing'
  phone_number?: string
  push_name?: string
  platform?: string
  created_at?: string
  connected_at?: string
  last_seen?: string
}

export interface SessionStatus {
  authenticated: boolean
  status: string
  phone_number?: string
  push_name?: string
  platform?: string
  connection_state?: string
}

export interface QRResponse {
  qr_code: string
  timeout: number
}

export function useSessions() {
  const api = useApi()

  const fetchSessions = () => 
    api.get<{ sessions: Session[] }>('/sessions')

  const createSession = (sessionId: string) =>
    api.post<Session>('/sessions', { session_id: sessionId })

  const getSessionStatus = (sessionId: string) =>
    api.get<SessionStatus>(`/${sessionId}/status`)

  const connectSession = (sessionId: string) =>
    api.post(`/${sessionId}/connect`)

  const disconnectSession = (sessionId: string) =>
    api.post(`/${sessionId}/disconnect`)

  const deleteSession = (sessionId: string) =>
    api.delete(`/${sessionId}`)

  const logoutSession = (sessionId: string) =>
    api.post(`/${sessionId}/logout`)

  const restartSession = (sessionId: string) =>
    api.post(`/${sessionId}/restart`)

  const getQRCode = (sessionId: string) =>
    api.get<QRResponse>(`/${sessionId}/qr`)

  const pairPhone = (sessionId: string, phoneNumber: string) =>
    api.post(`/${sessionId}/pairphone`, { phone_number: phoneNumber })

  return {
    fetchSessions,
    createSession,
    getSessionStatus,
    connectSession,
    disconnectSession,
    deleteSession,
    logoutSession,
    restartSession,
    getQRCode,
    pairPhone,
  }
}
