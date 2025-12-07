const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

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
  status: 'connected' | 'disconnected' | 'connecting'
  apiKey?: string
  pushName?: string
  profilePicture?: string
  stats?: SessionStats
  createdAt?: string
  updatedAt?: string
}

export interface SessionResponse extends Session {}

export interface QRResponse {
  qr?: string
  status: string
}

async function getApiKey(): Promise<string> {
  if (typeof window !== 'undefined') {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('api_key='))
    return cookie?.split('=')[1] || ''
  }
  return ''
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = await getApiKey()
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export async function getSessions(): Promise<Session[]> {
  const data = await apiRequest<Session[]>('/sessions')
  return data || []
}

export async function createSession(name: string): Promise<Session> {
  return apiRequest<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiRequest(`/${sessionId}`, { method: 'DELETE' })
}

export async function getSessionStatus(sessionId: string): Promise<SessionResponse> {
  return apiRequest<SessionResponse>(`/${sessionId}/status`)
}

export async function connectSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest(`/${sessionId}/connect`, { method: 'POST' })
}

export async function disconnectSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest(`/${sessionId}/disconnect`, { method: 'POST' })
}

export async function restartSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest(`/${sessionId}/restart`, { method: 'POST' })
}

export async function logoutSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest(`/${sessionId}/logout`, { method: 'POST' })
}

export async function getSessionQR(sessionId: string): Promise<QRResponse> {
  return apiRequest<QRResponse>(`/${sessionId}/qr`)
}

export async function getSessionProfile(sessionId: string): Promise<{
  phone: string
  pushName: string
  status: string
  profilePicture?: string
}> {
  return apiRequest(`/${sessionId}/profile`)
}
