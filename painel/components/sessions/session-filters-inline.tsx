"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FilterStatus, SessionListStats } from "./types"

interface SessionFiltersInlineProps {
  stats: SessionListStats
  filter: FilterStatus
  onFilterChange: (filter: FilterStatus) => void
}

export function SessionFiltersInline({
  stats,
  filter,
  onFilterChange,
}: SessionFiltersInlineProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge
        onClick={() => onFilterChange("all")}
        variant={filter === "all" ? "default" : "outline"}
        className="cursor-pointer transition-colors text-xs px-2.5 py-0.5"
      >
        Todas {stats.total}
      </Badge>
      <Badge
        onClick={() => onFilterChange("connected")}
        variant={filter === "connected" ? "default" : "outline"}
        className="cursor-pointer transition-colors text-xs px-2.5 py-0.5"
      >
        Conectadas {stats.connected}
      </Badge>
      <Badge
        onClick={() => onFilterChange("disconnected")}
        variant={filter === "disconnected" ? "default" : "outline"}
        className="cursor-pointer transition-colors text-xs px-2.5 py-0.5"
      >
        Desconectadas {stats.disconnected}
      </Badge>
      <Badge
        onClick={() => onFilterChange("connecting")}
        variant={filter === "connecting" ? "default" : "outline"}
        className="cursor-pointer transition-colors text-xs px-2.5 py-0.5"
      >
        Conectando {stats.connecting}
      </Badge>
      <Button className="ml-auto gap-1.5 bg-green-600 hover:bg-green-700 h-8 text-xs px-3">
        <Plus className="h-3.5 w-3.5" />
        Nova Sessão
      </Button>
    </div>
  )
}
