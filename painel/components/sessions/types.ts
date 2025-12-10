export type SessionStatus = "connected" | "connecting" | "disconnected"

export interface SessionApiStats {
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
  status: SessionStatus
  apiKey?: string
  pushName?: string
  profilePicture?: string
  about?: string
  platform?: string
  businessName?: string
  lastConnectedAt?: string
  lastDisconnectedAt?: string
  lastActivityAt?: string
  disconnectReason?: string
  syncHistory?: boolean
  historySyncStatus?: string
  stats?: SessionApiStats
  createdAt: string
  updatedAt: string
}

export type FilterStatus = "all" | SessionStatus

export interface SessionListStats {
  total: number
  connected: number
  disconnected: number
  connecting: number
}

export const statusConfig = {
  connected: {
    label: "Conectado",
    color: "bg-primary",
    badgeClass: "bg-muted text-primary hover:bg-accent",
  },
  connecting: {
    label: "Conectando",
    color: "bg-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground hover:bg-accent",
  },
  disconnected: {
    label: "Desconectado",
    color: "bg-destructive",
    badgeClass: "bg-muted text-destructive hover:bg-accent",
  },
} as const
