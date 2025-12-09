export type SessionStatus = "connected" | "disconnected" | "qr_pending"

export interface Session {
  id: string
  name: string
  phone: string | null
  status: SessionStatus
  lastActivity: string
  messagesCount: number
  avatar?: string
}

export type FilterStatus = "all" | SessionStatus

export interface SessionStats {
  total: number
  connected: number
  disconnected: number
  pending: number
}

export const statusConfig = {
  connected: {
    label: "Conectado",
    color: "bg-green-500",
    badgeClass: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  },
  disconnected: {
    label: "Desconectado",
    color: "bg-gray-400",
    badgeClass: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
  },
  qr_pending: {
    label: "Aguardando QR",
    color: "bg-yellow-500",
    badgeClass: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  },
} as const
