import { apiClient, ApiResponse } from "./client"

export interface WebhookConfig {
  id?: string
  sessionId: string
  url: string
  events: string[]
  enabled: boolean
  secret?: string
  createdAt?: string
  updatedAt?: string
}

export interface WebhookEvent {
  name: string
  label: string
  description?: string
  category?: string
}

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  { name: "message.received", label: "Message Received", category: "Messages" },
  { name: "message.sent", label: "Message Sent", category: "Messages" },
  { name: "message.delivered", label: "Message Delivered", category: "Messages" },
  { name: "message.read", label: "Message Read", category: "Messages" },
  { name: "message.played", label: "Message Played", category: "Messages" },
  { name: "message.reaction", label: "Message Reaction", category: "Messages" },
  { name: "message.deleted", label: "Message Deleted", category: "Messages" },
  { name: "message.edited", label: "Message Edited", category: "Messages" },
  { name: "session.connected", label: "Session Connected", category: "Session" },
  { name: "session.disconnected", label: "Session Disconnected", category: "Session" },
  { name: "session.qr", label: "QR Code Generated", category: "Session" },
  { name: "session.logged_out", label: "Session Logged Out", category: "Session" },
  { name: "chat.presence", label: "Chat Presence", category: "Chat" },
  { name: "chat.archived", label: "Chat Archived", category: "Chat" },
  { name: "group.created", label: "Group Created", category: "Groups" },
  { name: "group.updated", label: "Group Updated", category: "Groups" },
  { name: "group.participant_added", label: "Participant Added", category: "Groups" },
  { name: "group.participant_removed", label: "Participant Removed", category: "Groups" },
  { name: "call.received", label: "Call Received", category: "Calls" },
  { name: "call.missed", label: "Call Missed", category: "Calls" },
]

export async function getWebhook(
  sessionId: string
): Promise<ApiResponse<WebhookConfig>> {
  return apiClient<WebhookConfig>(`/sessions/${sessionId}/webhook`)
}

export async function setWebhook(
  sessionId: string,
  config: Omit<WebhookConfig, "id" | "sessionId" | "createdAt" | "updatedAt">
): Promise<ApiResponse<WebhookConfig>> {
  return apiClient<WebhookConfig>(`/sessions/${sessionId}/webhook`, {
    method: "POST",
    body: JSON.stringify(config),
  })
}

export async function updateWebhook(
  sessionId: string,
  config: Partial<Omit<WebhookConfig, "id" | "sessionId" | "createdAt" | "updatedAt">>
): Promise<ApiResponse<WebhookConfig>> {
  return apiClient<WebhookConfig>(`/sessions/${sessionId}/webhook`, {
    method: "PUT",
    body: JSON.stringify(config),
  })
}

export async function deleteWebhook(
  sessionId: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/webhook`, {
    method: "DELETE",
  })
}

export async function getAvailableEvents(): Promise<ApiResponse<WebhookEvent[]>> {
  return apiClient<WebhookEvent[]>("/events")
}

export function groupEventsByCategory(events: WebhookEvent[]): Record<string, WebhookEvent[]> {
  return events.reduce((acc, event) => {
    const category = event.category || "Other"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(event)
    return acc
  }, {} as Record<string, WebhookEvent[]>)
}
