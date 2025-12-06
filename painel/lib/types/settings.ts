export interface Settings {
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
  groupAdd: string
  callAdd: string
  defaultDisappearingTimer: string
  privacySyncedAt?: string
  createdAt: string
  updatedAt: string
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

export const PRIVACY_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "contacts", label: "Meus contatos" },
  { value: "contact_blacklist", label: "Contatos exceto..." },
  { value: "none", label: "Ninguém" },
]

export const DISAPPEARING_TIMER_OPTIONS = [
  { value: "off", label: "Desativado" },
  { value: "24h", label: "24 horas" },
  { value: "7d", label: "7 dias" },
  { value: "90d", label: "90 dias" },
]
