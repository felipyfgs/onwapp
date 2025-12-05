import type { Session, CreateSessionRequest, QRResponse, MessageResponse, Webhook, WebhookFormData } from '@/types'

// Use proxy to avoid CORS/ad blocker issues
const API_URL = '/api'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options?.headers) {
    const h = options.headers as Record<string, string>
    Object.assign(headers, h)
  }

  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('apiKey') : null
  if (apiKey) {
    headers['Authorization'] = apiKey
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  sessions: {
    list: () => fetchApi<Session[]>('/sessions'),
    
    create: (data: CreateSessionRequest) => 
      fetchApi<Session>('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    get: (sessionId: string) => 
      fetchApi<Session>(`/${sessionId}/status`),
    
    delete: (sessionId: string) => 
      fetchApi<MessageResponse>(`/${sessionId}`, {
        method: 'DELETE',
      }),
    
    connect: (sessionId: string) => 
      fetchApi<MessageResponse>(`/${sessionId}/connect`, {
        method: 'POST',
      }),
    
    disconnect: (sessionId: string) => 
      fetchApi<MessageResponse>(`/${sessionId}/disconnect`, {
        method: 'POST',
      }),
    
    logout: (sessionId: string) => 
      fetchApi<MessageResponse>(`/${sessionId}/logout`, {
        method: 'POST',
      }),
    
    restart: (sessionId: string) => 
      fetchApi<MessageResponse>(`/${sessionId}/restart`, {
        method: 'POST',
      }),
    
    qr: (sessionId: string) => 
      fetchApi<QRResponse>(`/${sessionId}/qr`),
  },

  webhooks: {
    get: (sessionId: string) => 
      fetchApi<Webhook>(`/${sessionId}/webhook`),
    
    set: (sessionId: string, data: WebhookFormData) => 
      fetchApi<Webhook>(`/${sessionId}/webhook`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (sessionId: string, data: Partial<WebhookFormData>) => 
      fetchApi<Webhook>(`/${sessionId}/webhook`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (sessionId: string) => 
      fetchApi<MessageResponse>(`/${sessionId}/webhook`, {
        method: 'DELETE',
      }),
  },
}
