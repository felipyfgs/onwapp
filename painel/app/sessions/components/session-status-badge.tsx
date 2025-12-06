'use client'

import { SessionStatus } from '@/types/session'

const statusConfig: Record<SessionStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: string;
  colors: string;
}> = {
  connected: { 
    label: 'Conectado', 
    variant: 'default',
    icon: '🟢',
    colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
  },
  connecting: { 
    label: 'Conectando', 
    variant: 'secondary',
    icon: '🟡',
    colors: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
  },
  disconnected: { 
    label: 'Desconectado', 
    variant: 'outline',
    icon: '🔴',
    colors: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
  },
}

interface SessionStatusBadgeProps {
  status: SessionStatus
}

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.disconnected

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${config.colors}`}>
      <span className="text-base">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  )
}
