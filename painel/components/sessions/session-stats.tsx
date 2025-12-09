"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Wifi, WifiOff } from "lucide-react"
import { FilterStatus, SessionListStats } from "./types"

interface SessionStatsCardsProps {
  stats: SessionListStats
  onFilterChange: (filter: FilterStatus) => void
}

export function SessionStatsCards({ stats, onFilterChange }: SessionStatsCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card 
        className="cursor-pointer transition-colors hover:bg-muted/50 border-border/50" 
        onClick={() => onFilterChange("all")}
      >
        <CardContent className="flex items-center gap-2.5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none mb-1">{stats.total}</p>
            <p className="text-xs text-muted-foreground leading-none">Total</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer transition-colors hover:bg-muted/50 border-border/50" 
        onClick={() => onFilterChange("connected")}
      >
        <CardContent className="flex items-center gap-2.5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10">
            <Wifi className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none mb-1">{stats.connected}</p>
            <p className="text-xs text-muted-foreground leading-none">Conectadas</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer transition-colors hover:bg-muted/50 border-border/50" 
        onClick={() => onFilterChange("disconnected")}
      >
        <CardContent className="flex items-center gap-2.5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
            <WifiOff className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none mb-1">{stats.disconnected}</p>
            <p className="text-xs text-muted-foreground leading-none">Desconectadas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
