// Webhook types based on backend models

export interface Webhook {
  id?: string
  sessionId: string
  url: string
  events: string[]
  enabled: boolean
  secret?: string
  createdAt?: string
  updatedAt?: string
}

export interface SetWebhookRequest {
  url: string
  events: string[]
  enabled: boolean
  secret?: string
}

export interface WebhookEventsResponse {
  categories: Record<string, string[]>
  all: string[]
}

export interface MessageResponse {
  message: string
}

