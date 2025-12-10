"use client"

import { Button } from "@/components/ui/button"
import { FilterStatus, SessionListStats } from "./types"
import { CreateSessionDialog } from "./create-session-dialog"

interface SessionFiltersInlineProps {
  stats: SessionListStats
  filter: FilterStatus
  onFilterChange: (filter: FilterStatus) => void
  onSessionCreated?: () => void
}

export function SessionFiltersInline({
  stats,
  filter,
  onFilterChange,
  onSessionCreated,
}: SessionFiltersInlineProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        onClick={() => onFilterChange("all")}
        variant={filter === "all" ? "default" : "outline"}
        size="sm"
      >
        Todas {stats.total}
      </Button>
      <Button
        onClick={() => onFilterChange("connected")}
        variant={filter === "connected" ? "default" : "outline"}
        size="sm"
      >
        Conectadas {stats.connected}
      </Button>
      <Button
        onClick={() => onFilterChange("disconnected")}
        variant={filter === "disconnected" ? "default" : "outline"}
        size="sm"
      >
        Desconectadas {stats.disconnected}
      </Button>
      <Button
        onClick={() => onFilterChange("connecting")}
        variant={filter === "connecting" ? "default" : "outline"}
        size="sm"
      >
        Conectando {stats.connecting}
      </Button>
      <div className="ml-auto">
        <CreateSessionDialog onSuccess={onSessionCreated} />
      </div>
    </div>
  )
}
