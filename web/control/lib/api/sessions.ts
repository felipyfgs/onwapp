import { apiClient, ApiResponse } from "./client"

export type SessionStatus = "disconnected" | "connecting" | "connected"

export interface Session {
  id: number
  session: string
  status: SessionStatus
  phone?: string
  pushName?: string
  profilePictureUrl?: string
  about?: string
  platform?: string
  businessName?: string
  apiKey?: string
  createdAt: string
  updatedAt: string
  lastConnectedAt?: string
  lastDisconnectedAt?: string
}

export interface CreateSessionRequest {
  session: string
}

export interface QRCodeResponse {
  qr: string
  timeout?: number
}

export interface PairPhoneRequest {
  phone: string
}

export interface PairPhoneResponse {
  code: string
}

export async function getSessions(): Promise<ApiResponse<Session[]>> {
  return apiClient<Session[]>("/sessions")
}

export async function getSession(sessionId: string): Promise<ApiResponse<Session>> {
  return apiClient<Session>(`/sessions/${sessionId}/status`)
}

export async function createSession(
  data: CreateSessionRequest
): Promise<ApiResponse<Session>> {
  return apiClient<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function deleteSession(sessionId: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}`, {
    method: "DELETE",
  })
}

export async function connectSession(sessionId: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/connect`, {
    method: "POST",
  })
}

export async function disconnectSession(sessionId: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/disconnect`, {
    method: "POST",
  })
}

export async function logoutSession(sessionId: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/logout`, {
    method: "POST",
  })
}

export async function restartSession(sessionId: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/restart`, {
    method: "POST",
  })
}

export async function getQRCode(sessionId: string): Promise<ApiResponse<QRCodeResponse>> {
  return apiClient<QRCodeResponse>(`/sessions/${sessionId}/qr`)
}

export async function pairPhone(
  sessionId: string,
  data: PairPhoneRequest
): Promise<ApiResponse<PairPhoneResponse>> {
  return apiClient<PairPhoneResponse>(`/sessions/${sessionId}/pairphone`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
