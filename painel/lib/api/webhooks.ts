import { apiRequest } from './config'

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
