import { apiClient, ApiResponse } from "./client"

export type PrivacyValue = "all" | "contacts" | "contact_blacklist" | "none"
export type OnlinePrivacy = "all" | "match_last_seen"
export type ReadReceiptsValue = "all" | "none"
export type GroupAddValue = "all" | "contacts" | "contact_blacklist"
export type CallAddValue = "all" | "known"
export type DisappearingTimer = "off" | "24h" | "7d" | "90d"

export interface SessionSettings {
  id: number
  sessionId: number
  alwaysOnline: boolean
  autoRejectCalls: boolean
  syncHistory: boolean
  lastSeen: PrivacyValue
  online: OnlinePrivacy
  profilePhoto: PrivacyValue
  status: PrivacyValue
  readReceipts: ReadReceiptsValue
  groupAdd: GroupAddValue
  callAdd: CallAddValue
  defaultDisappearingTimer: DisappearingTimer
  privacySyncedAt?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateSettingsRequest {
  alwaysOnline?: boolean
  autoRejectCalls?: boolean
  syncHistory?: boolean
  lastSeen?: PrivacyValue
  online?: OnlinePrivacy
  profilePhoto?: PrivacyValue
  status?: PrivacyValue
  readReceipts?: ReadReceiptsValue
  groupAdd?: GroupAddValue
  callAdd?: CallAddValue
  defaultDisappearingTimer?: DisappearingTimer
}

export async function getSettings(
  sessionId: string
): Promise<ApiResponse<SessionSettings>> {
  return apiClient(`/sessions/${sessionId}/settings`)
}

export async function updateSettings(
  sessionId: string,
  data: UpdateSettingsRequest
): Promise<ApiResponse<SessionSettings>> {
  return apiClient(`/sessions/${sessionId}/settings`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const PRIVACY_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "contacts", label: "My Contacts" },
  { value: "contact_blacklist", label: "My Contacts Except..." },
  { value: "none", label: "Nobody" },
] as const

export const ONLINE_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "match_last_seen", label: "Same as Last Seen" },
] as const

export const READ_RECEIPTS_OPTIONS = [
  { value: "all", label: "Enabled" },
  { value: "none", label: "Disabled" },
] as const

export const GROUP_ADD_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "contacts", label: "My Contacts" },
  { value: "contact_blacklist", label: "My Contacts Except..." },
] as const

export const CALL_ADD_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "known", label: "Known Contacts Only" },
] as const

export const DISAPPEARING_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "90d", label: "90 Days" },
] as const
