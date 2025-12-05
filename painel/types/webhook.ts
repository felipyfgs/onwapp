export interface Webhook {
  id: string
  sessionId: string
  url: string
  events: string[]
  enabled: boolean
}

export interface WebhookFormData {
  url: string
  events: string[]
  enabled: boolean
}

export const WEBHOOK_EVENTS = [
  'message.received',
  'message.sent',
  'message.ack',
  'message.revoked',
  'presence.update',
  'group.join',
  'group.leave',
  'connection.update',
  'qr.update',
] as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]
