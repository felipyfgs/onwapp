"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { FilterStatus } from "./types"

interface SessionFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  filter: FilterStatus
  onFilterChange: (filter: FilterStatus) => void
}

export function SessionFilters({ 
  search, 
  onSearchChange, 
  filter, 
  onFilterChange 
}: SessionFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome, telefone ou ID..." 
          className="pl-10"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button 
          variant={filter === "all" ? "default" : "outline"} 
          size="sm"
          onClick={() => onFilterChange("all")}
        >
          Todas
        </Button>
        <Button 
          variant={filter === "connected" ? "default" : "outline"} 
          size="sm"
          onClick={() => onFilterChange("connected")}
        >
          Conectadas
        </Button>
        <Button 
          variant={filter === "disconnected" ? "default" : "outline"} 
          size="sm"
          onClick={() => onFilterChange("disconnected")}
        >
          Offline
        </Button>
      </div>
    </div>
  )
}
