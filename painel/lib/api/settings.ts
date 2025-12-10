import { api } from "./client"

export interface SessionSettings {
  id: number
  sessionId: number
  alwaysOnline: boolean
  autoRejectCalls: boolean
  syncHistory: boolean
  lastSeen: string
  online: string
  profilePhoto: string
  status: string
  readReceipts: string
  groupAdd?: string
  callAdd?: string
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
}

export async function getSettings(session: string): Promise<SessionSettings> {
  return api<SessionSettings>(`/${session}/settings`)
}

export async function updateSettings(session: string, data: UpdateSettingsRequest): Promise<SessionSettings> {
  return api<SessionSettings>(`/${session}/settings`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}
