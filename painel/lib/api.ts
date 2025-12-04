const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''

export interface Session {
  name: string
  status: 'connected' | 'disconnected' | 'qr_pending' | 'connecting'
  phone?: string
  version?: string
  database?: string
}

export interface SessionStatus {
  status: string
  version: string
  database: string
  time: string
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getHealth(): Promise<SessionStatus> {
  return apiRequest<SessionStatus>('/health')
}

export async function getSessionStatus(sessionName: string): Promise<SessionStatus> {
  return apiRequest<SessionStatus>(`/${sessionName}/status`)
}

export async function connectSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/connect`, { method: 'POST' })
}

export async function disconnectSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/disconnect`, { method: 'POST' })
}

export async function deleteSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}`, { method: 'DELETE' })
}

export async function getSessionQR(sessionName: string): Promise<{ qr: string }> {
  return apiRequest<{ qr: string }>(`/${sessionName}/qr`)
}

export async function restartSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/restart`, { method: 'POST' })
}

export async function logoutSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/logout`, { method: 'POST' })
}
