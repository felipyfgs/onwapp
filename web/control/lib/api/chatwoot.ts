import { apiClient, ApiResponse } from "./client"

export interface ChatwootConfig {
  enabled: boolean
  url: string
  token: string
  account: number
  inboxId: number
  signAgent?: boolean
  autoReopen?: boolean
  syncContacts?: boolean
  syncMessages?: boolean
  syncDays?: number
  reopenDays?: number
  autoCreate?: boolean
}

export interface SyncStatus {
  status: "idle" | "running" | "completed" | "failed"
  progress?: number
  lastSyncAt?: string
  error?: string
  contactsSynced?: number
  messagesSynced?: number
}

export interface ChatwootOverview {
  enabled: boolean
  connected: boolean
  totalContacts?: number
  totalConversations?: number
  lastSyncAt?: string
}

export interface ValidateCredentialsRequest {
  url: string
  token: string
  account: number
}

export interface ValidateCredentialsResponse {
  valid: boolean
  accountName?: string
  error?: string
}

export async function getChatwootConfig(
  sessionId: string
): Promise<ApiResponse<ChatwootConfig>> {
  return apiClient<ChatwootConfig>(`/sessions/${sessionId}/chatwoot/find`)
}

export async function setChatwootConfig(
  sessionId: string,
  config: ChatwootConfig
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chatwoot/set`, {
    method: "POST",
    body: JSON.stringify(config),
  })
}

export async function deleteChatwootConfig(
  sessionId: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chatwoot`, {
    method: "DELETE",
  })
}

export async function validateCredentials(
  data: ValidateCredentialsRequest
): Promise<ApiResponse<ValidateCredentialsResponse>> {
  return apiClient<ValidateCredentialsResponse>("/chatwoot/validate", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function syncAll(
  sessionId: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chatwoot/sync`, {
    method: "POST",
  })
}

export async function syncContacts(
  sessionId: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chatwoot/sync/contacts`, {
    method: "POST",
  })
}

export async function syncMessages(
  sessionId: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chatwoot/sync/messages`, {
    method: "POST",
  })
}

export async function getSyncStatus(
  sessionId: string
): Promise<ApiResponse<SyncStatus>> {
  return apiClient<SyncStatus>(`/sessions/${sessionId}/chatwoot/sync/status`)
}

export async function getOverview(
  sessionId: string
): Promise<ApiResponse<ChatwootOverview>> {
  return apiClient<ChatwootOverview>(`/sessions/${sessionId}/chatwoot/overview`)
}

export async function resetChatwoot(
  sessionId: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/sessions/${sessionId}/chatwoot/reset`, {
    method: "POST",
  })
}

export async function resolveAllConversations(
  sessionId: string
): Promise<ApiResponse<{ resolved: number }>> {
  return apiClient<{ resolved: number }>(`/sessions/${sessionId}/chatwoot/resolve-all`, {
    method: "POST",
  })
}
