"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Users, User, Search, RefreshCw, Archive } from "lucide-react"

export type ChatFilterType = "all" | "personal" | "groups" | "archived"

interface ChatFiltersProps {
  filter: ChatFilterType
  onFilterChange: (filter: ChatFilterType) => void
  search: string
  onSearchChange: (search: string) => void
  onRefresh: () => void
  refreshing: boolean
  stats: {
    total: number
    personal: number
    groups: number
    archived: number
  }
}

export function ChatFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onRefresh,
  refreshing,
  stats,
}: ChatFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("all")}
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Todos ({stats.total})
        </Button>
        <Button
          variant={filter === "personal" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("personal")}
        >
          <User className="h-4 w-4 mr-1.5" />
          Pessoais ({stats.personal})
        </Button>
        <Button
          variant={filter === "groups" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("groups")}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Grupos ({stats.groups})
        </Button>
        <Button
          variant={filter === "archived" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("archived")}
        >
          <Archive className="h-4 w-4 mr-1.5" />
          Arquivados ({stats.archived})
        </Button>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  )
}
