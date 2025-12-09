"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Wifi, WifiOff, QrCode } from "lucide-react"
import { FilterStatus, SessionStats } from "./types"

interface SessionStatsCardsProps {
  stats: SessionStats
  onFilterChange: (filter: FilterStatus) => void
}

export function SessionStatsCards({ stats, onFilterChange }: SessionStatsCardsProps) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="cursor-pointer transition-colors hover:bg-muted/50" 
        onClick={() => onFilterChange("all")}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer transition-colors hover:bg-muted/50" 
        onClick={() => onFilterChange("connected")}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <Wifi className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.connected}</p>
            <p className="text-sm text-muted-foreground">Conectadas</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer transition-colors hover:bg-muted/50" 
        onClick={() => onFilterChange("disconnected")}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-500/10">
            <WifiOff className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.disconnected}</p>
            <p className="text-sm text-muted-foreground">Desconectadas</p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer transition-colors hover:bg-muted/50" 
        onClick={() => onFilterChange("qr_pending")}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
            <QrCode className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Aguardando QR</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
