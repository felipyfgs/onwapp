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
    color: "bg-green-500",
    badgeClass: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  },
  connecting: {
    label: "Conectando",
    color: "bg-yellow-500",
    badgeClass: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  },
  disconnected: {
    label: "Desconectado",
    color: "bg-gray-400",
    badgeClass: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
  },
} as const
