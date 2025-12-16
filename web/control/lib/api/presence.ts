import { apiClient, ApiResponse } from "./client"

export type PresenceType = "available" | "unavailable" | "composing" | "recording"

export interface SetPresenceRequest {
  jid: string
  presence: PresenceType
}

export interface SubscribePresenceRequest {
  jid: string
}

export async function setPresence(
  sessionId: string,
  data: SetPresenceRequest
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/presence`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function subscribePresence(
  sessionId: string,
  data: SubscribePresenceRequest
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/presence/subscribe`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function setTyping(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ message: string }>> {
  return setPresence(sessionId, { jid, presence: "composing" })
}

export async function setRecording(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ message: string }>> {
  return setPresence(sessionId, { jid, presence: "recording" })
}

export async function setOnline(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ message: string }>> {
  return setPresence(sessionId, { jid, presence: "available" })
}

export async function setOffline(
  sessionId: string,
  jid: string
): Promise<ApiResponse<{ message: string }>> {
  return setPresence(sessionId, { jid, presence: "unavailable" })
}
