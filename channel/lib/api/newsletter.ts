import { apiClient, ApiResponse } from "./client"

export interface Newsletter {
  id: string
  name: string
  description?: string
  pictureUrl?: string
  subscriberCount?: number
  state: "active" | "suspended" | "geosuspended"
  createdAt: string
}

export interface NewsletterMessage {
  id: string
  serverTimestamp: number
  text?: string
  mediaType?: string
  reactions?: Record<string, number>
}

export interface CreateNewsletterRequest {
  name: string
  description?: string
  picture?: string
}

export interface NewsletterReactionRequest {
  messageServerId: string
  reaction: string
}

export async function createNewsletter(
  sessionId: string,
  data: CreateNewsletterRequest
): Promise<ApiResponse<Newsletter>> {
  return apiClient(`/${sessionId}/newsletter/create`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getNewsletters(
  sessionId: string
): Promise<ApiResponse<Newsletter[]>> {
  return apiClient(`/${sessionId}/newsletter/list`)
}

export async function getNewsletterInfo(
  sessionId: string,
  jid: string
): Promise<ApiResponse<Newsletter>> {
  return apiClient(`/${sessionId}/newsletter/info?jid=${encodeURIComponent(jid)}`)
}

export async function followNewsletter(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/newsletter/follow`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  })
}

export async function unfollowNewsletter(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/newsletter/unfollow`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  })
}

export async function getNewsletterMessages(
  sessionId: string,
  jid: string,
  count?: number
): Promise<ApiResponse<NewsletterMessage[]>> {
  const params = new URLSearchParams({ jid })
  if (count) params.append("count", String(count))
  return apiClient(`/${sessionId}/newsletter/messages?${params}`)
}

export async function reactToNewsletterMessage(
  sessionId: string,
  jid: string,
  data: NewsletterReactionRequest
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/newsletter/react`, {
    method: "POST",
    body: JSON.stringify({ jid, ...data }),
  })
}

export async function muteNewsletter(
  sessionId: string,
  jid: string,
  mute: boolean
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/newsletter/mute`, {
    method: "POST",
    body: JSON.stringify({ jid, mute }),
  })
}

export async function markNewsletterViewed(
  sessionId: string,
  jid: string,
  messageServerIds: string[]
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/newsletter/viewed`, {
    method: "POST",
    body: JSON.stringify({ jid, messageServerIds }),
  })
}

export async function subscribeLiveNewsletter(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/newsletter/subscribe-live`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  })
}
