"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search, RefreshCw } from "lucide-react"

interface GroupFiltersProps {
  total: number
  search: string
  onSearchChange: (search: string) => void
  onRefresh: () => void
  refreshing: boolean
}

export function GroupFilters({
  total,
  search,
  onSearchChange,
  onRefresh,
  refreshing,
}: GroupFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">{total} grupos</span>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupo..."
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
