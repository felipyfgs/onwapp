"use client"

import { Badge } from "@/components/ui/badge"
import type { Session } from "@/types"

interface SessionStatusBadgeProps {
  status: Session['status']
}

const statusConfig = {
  connected: {
    label: "Conectado",
    variant: "default" as const,
    className: "bg-green-500 hover:bg-green-600",
  },
  connecting: {
    label: "Conectando",
    variant: "secondary" as const,
    className: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  disconnected: {
    label: "Desconectado",
    variant: "outline" as const,
    className: "text-muted-foreground",
  },
}

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.disconnected

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
