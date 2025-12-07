const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface Webhook {
  id?: string
  sessionId: string
  url: string
  events: string[]
  enabled: boolean
}

export interface WebhookEvents {
  categories: Record<string, string[]>
  all: string[]
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

export async function getWebhook(sessionId: string): Promise<Webhook> {
  return apiRequest<Webhook>(`/${sessionId}/webhook`)
}

export async function setWebhook(
  sessionId: string,
  data: { url: string; events: string[]; enabled: boolean; secret?: string }
): Promise<Webhook> {
  return apiRequest<Webhook>(`/${sessionId}/webhook`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateWebhook(
  sessionId: string,
  data: { url: string; events: string[]; enabled: boolean; secret?: string }
): Promise<Webhook> {
  return apiRequest<Webhook>(`/${sessionId}/webhook`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteWebhook(sessionId: string): Promise<void> {
  await apiRequest(`/${sessionId}/webhook`, { method: 'DELETE' })
}

export async function getWebhookEvents(): Promise<WebhookEvents> {
  return apiRequest<WebhookEvents>('/events')
}
