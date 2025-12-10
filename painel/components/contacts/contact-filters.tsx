"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Building2, User, Search, RefreshCw } from "lucide-react"

export type ContactFilterType = "all" | "business" | "personal"

interface ContactFiltersProps {
  filter: ContactFilterType
  onFilterChange: (filter: ContactFilterType) => void
  search: string
  onSearchChange: (search: string) => void
  onRefresh: () => void
  refreshing: boolean
  stats: {
    total: number
    business: number
    personal: number
  }
}

export function ContactFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onRefresh,
  refreshing,
  stats,
}: ContactFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("all")}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Todos ({stats.total})
        </Button>
        <Button
          variant={filter === "business" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("business")}
        >
          <Building2 className="h-4 w-4 mr-1.5" />
          Business ({stats.business})
        </Button>
        <Button
          variant={filter === "personal" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("personal")}
        >
          <User className="h-4 w-4 mr-1.5" />
          Pessoal ({stats.personal})
        </Button>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
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
