import { Smartphone, Wifi, WifiOff } from 'lucide-react'

interface SessionStatsProps {
  total: number
  connected: number
  disconnected: number
}

export function SessionStats({ total, connected, disconnected }: SessionStatsProps) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Smartphone className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">{total}</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
        <div className="rounded-full bg-green-500/10 p-2">
          <Wifi className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Conectadas</p>
          <p className="text-xl font-semibold text-green-500">{connected}</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-3 flex items-center gap-3">
        <div className="rounded-full bg-red-500/10 p-2">
          <WifiOff className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Desconectadas</p>
          <p className="text-xl font-semibold text-red-500">{disconnected}</p>
        </div>
      </div>
    </div>
  )
}
