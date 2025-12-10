"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Wifi, WifiOff } from "lucide-react"
import { SessionListStats } from "./types"

interface SessionStatsCardsProps {
  stats: SessionListStats
}

export function SessionStatsCards({ stats }: SessionStatsCardsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Card className="border-border">
        <CardContent className="flex items-center gap-3 px-3 py-1.5">
          <Smartphone className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="ml-auto text-2xl font-bold">{stats.total}</span>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="flex items-center gap-3 px-3 py-1.5">
          <Wifi className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">Conectadas</span>
          <span className="ml-auto text-2xl font-bold text-primary">{stats.connected}</span>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="flex items-center gap-3 px-3 py-1.5">
          <WifiOff className="h-6 w-6 text-destructive" />
          <span className="text-sm text-muted-foreground">Desconectadas</span>
          <span className="ml-auto text-2xl font-bold text-destructive">{stats.disconnected}</span>
        </CardContent>
      </Card>
    </div>
  )
}
