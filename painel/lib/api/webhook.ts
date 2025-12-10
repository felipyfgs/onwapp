import { api } from "./client"

export interface WebhookConfig {
  id?: string
  sessionId: string
  url?: string
  events?: string[]
  enabled: boolean
  secret?: string
}

export interface SetWebhookRequest {
  url: string
  events?: string[]
  enabled?: boolean
  secret?: string
}

export interface EventsResponse {
  categories: Record<string, string[]>
  all: string[]
}

export async function getWebhook(session: string): Promise<WebhookConfig | null> {
  try {
    return await api<WebhookConfig>(`/${session}/webhook`)
  } catch {
    return null
  }
}

export async function createWebhook(session: string, data: SetWebhookRequest): Promise<WebhookConfig> {
  return api<WebhookConfig>(`/${session}/webhook`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateWebhook(session: string, data: Partial<SetWebhookRequest>): Promise<WebhookConfig> {
  return api<WebhookConfig>(`/${session}/webhook`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteWebhook(session: string): Promise<void> {
  await api(`/${session}/webhook`, { method: "DELETE" })
}

export async function getAvailableEvents(): Promise<EventsResponse> {
  return api<EventsResponse>("/events")
}
