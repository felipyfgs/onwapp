// Componente para mostrar o status da conexão NATS
'use client'

import { useNatsStatus } from '@/lib/nats/nats-hooks'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function NatsStatus() {
  const status = useNatsStatus()

  const getStatusColor = () => {
    if (status.connecting) return 'bg-yellow-500 hover:bg-yellow-500/80'
    if (status.connected) return 'bg-green-500 hover:bg-green-500/80'
    return 'bg-red-500 hover:bg-red-500/80'
  }

  const getStatusText = () => {
    if (status.connecting) return 'Connecting...'
    if (status.connected) return 'Connected'
    if (status.error) return 'Disconnected'
    return 'Offline'
  }

  const getTooltipContent = () => {
    if (status.connecting) {
      return `Attempting to connect (${status.reconnectCount})`
    }
    if (status.connected) {
      return 'Connected to NATS server'
    }
    if (status.error) {
      return `Error: ${status.error.message || status.lastError || 'Unknown error'}`
    }
    return 'Not connected'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-white ${getStatusColor()}`}>
            {getStatusText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}