import { apiClient, ApiResponse } from "./client"

export interface StatusPrivacy {
  type: "contacts" | "blacklist" | "whitelist"
  list?: string[]
}

export interface SendStatusRequest {
  text?: string
  image?: string
  video?: string
  caption?: string
  mimetype?: string
  backgroundColor?: string
  font?: number
}

export interface SendStatusResponse {
  messageId: string
  timestamp: number
}

export async function sendStatus(
  sessionId: string,
  data: SendStatusRequest
): Promise<ApiResponse<SendStatusResponse>> {
  return apiClient(`/${sessionId}/status/send`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getStatusPrivacy(
  sessionId: string
): Promise<ApiResponse<StatusPrivacy>> {
  return apiClient(`/${sessionId}/status/privacy`)
}

export async function sendTextStatus(
  sessionId: string,
  text: string,
  backgroundColor?: string,
  font?: number
): Promise<ApiResponse<SendStatusResponse>> {
  return sendStatus(sessionId, { text, backgroundColor, font })
}

export async function sendImageStatus(
  sessionId: string,
  image: string,
  caption?: string
): Promise<ApiResponse<SendStatusResponse>> {
  return sendStatus(sessionId, { image, caption })
}

export async function sendVideoStatus(
  sessionId: string,
  video: string,
  caption?: string
): Promise<ApiResponse<SendStatusResponse>> {
  return sendStatus(sessionId, { video, caption })
}
