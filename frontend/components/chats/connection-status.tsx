"use client"

import { Smartphone, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected'
  phoneNumber?: string
  onReconnect?: () => void
  className?: string
}

export function ConnectionStatus({ 
  status, 
  phoneNumber, 
  onReconnect,
  className = ""
}: ConnectionStatusProps) {
  const statusConfig = {
    connected: {
      label: 'Conectado',
      dotClass: 'bg-chart-2',
      textClass: 'text-chart-2'
    },
    connecting: {
      label: 'Conectando...',
      dotClass: 'bg-chart-4 animate-pulse',
      textClass: 'text-chart-4'
    },
    disconnected: {
      label: 'Desconectado',
      dotClass: 'bg-destructive',
      textClass: 'text-destructive'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={cn("p-3 border-b border-border flex items-center gap-3 bg-background", className)}>
      <div className="relative">
        <Smartphone className="h-5 w-5 text-muted-foreground" />
        <span className={cn("absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background", config.dotClass)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", config.textClass)}>
          {config.label}
        </p>
        {phoneNumber && status === 'connected' && (
          <p className="text-xs text-muted-foreground truncate">
            {phoneNumber}
          </p>
        )}
      </div>
      
      {status === 'disconnected' && onReconnect && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReconnect}
          className="shrink-0 h-8 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Reconectar
        </Button>
      )}
      
      {status === 'connecting' && (
        <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
      )}
    </div>
  )
}
