import { apiRequest } from './config'

export interface SessionStats {
  messages: number
  chats: number
  contacts: number
  groups: number
}

export interface Session {
  id: string
  session: string
  deviceJid?: string
  phone?: string
  status: 'connected' | 'disconnected' | 'connecting'
  apiKey?: string
  pushName?: string
  profilePicture?: string
  stats?: SessionStats
  createdAt?: string
  updatedAt?: string
}

export type SessionResponse = Session

export interface QRResponse {
  qr?: string
  status: string
}

export async function getSessions(): Promise<Session[]> {
  const data = await apiRequest<Session[]>('/sessions')
  return data || []
}

export async function createSession(session: string): Promise<Session> {
  return apiRequest<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ session }),
  })
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiRequest(`/${sessionId}`, { method: 'DELETE' })
}

export async function getSessionStatus(sessionId: string): Promise<SessionResponse> {
  return apiRequest<SessionResponse>(`/${sessionId}/status`)
}

export async function connectSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest(`/${sessionId}/connect`, { method: 'POST' })
}

export async function disconnectSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest(`/${sessionId}/disconnect`, { method: 'POST' })
}

export async function restartSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest(`/${sessionId}/restart`, { method: 'POST' })
}

export async function logoutSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest(`/${sessionId}/logout`, { method: 'POST' })
}

export async function getSessionQR(sessionId: string): Promise<QRResponse> {
  return apiRequest<QRResponse>(`/${sessionId}/qr`)
}

export async function getSessionProfile(sessionId: string): Promise<{
  phone: string
  pushName: string
  status: string
  profilePicture?: string
}> {
  return apiRequest(`/${sessionId}/profile`)
}

export async function pairPhone(sessionId: string, phone: string): Promise<{ code: string }> {
  return apiRequest(`/${sessionId}/pairphone`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

// Settings types
export interface SessionSettings {
  sessionId: string
  alwaysOnline: boolean
  autoRejectCalls: boolean
  syncHistory: boolean
  lastSeen: string
  online: string
  profilePhoto: string
  status: string
  readReceipts: string
  groupAdd: string
  callAdd: string
  defaultDisappearingTimer: string
}

export interface UpdateSettingsRequest {
  alwaysOnline?: boolean
  autoRejectCalls?: boolean
  syncHistory?: boolean
  lastSeen?: string
  online?: string
  profilePhoto?: string
  status?: string
  readReceipts?: string
  groupAdd?: string
  callAdd?: string
  defaultDisappearingTimer?: string
}

export async function getSessionSettings(sessionId: string): Promise<SessionSettings> {
  return apiRequest<SessionSettings>(`/${sessionId}/settings`)
}

export async function updateSessionSettings(sessionId: string, settings: UpdateSettingsRequest): Promise<SessionSettings> {
  return apiRequest<SessionSettings>(`/${sessionId}/settings`, {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

// Profile update functions
export async function updatePushName(sessionId: string, name: string): Promise<void> {
  await apiRequest(`/${sessionId}/profile/name`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateStatus(sessionId: string, status: string): Promise<void> {
  await apiRequest(`/${sessionId}/profile/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export async function updateProfilePicture(sessionId: string, image: string): Promise<{ pictureId: string }> {
  return apiRequest(`/${sessionId}/profile/picture`, {
    method: 'POST',
    body: JSON.stringify({ image }),
  })
}

export async function deleteProfilePicture(sessionId: string): Promise<void> {
  await apiRequest(`/${sessionId}/profile/picture/remove`, {
    method: 'POST',
  })
}
