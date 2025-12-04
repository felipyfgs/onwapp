'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Session, SessionStatus } from '@/lib/types'

interface SessionCardProps {
  session: Session
  onConnect: (name: string) => Promise<void>
  onDisconnect: (name: string) => Promise<void>
  onDelete: (name: string) => Promise<void>
  onShowQR: (name: string) => void
}

const statusConfig: Record<SessionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  connected: { label: 'Conectado', variant: 'default' },
  disconnected: { label: 'Desconectado', variant: 'destructive' },
  qr_pending: { label: 'Aguardando QR', variant: 'secondary' },
  connecting: { label: 'Conectando...', variant: 'outline' },
}

export function SessionCard({
  session,
  onConnect,
  onDisconnect,
  onDelete,
  onShowQR,
}: SessionCardProps) {
  const [loading, setLoading] = useState(false)
  const config = statusConfig[session.status]

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true)
    try {
      await action()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{session.name}</CardTitle>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        {session.phone && (
          <CardDescription>{session.phone}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {session.version && (
          <p className="text-sm text-muted-foreground">
            Versao: {session.version}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 flex-wrap">
        {session.status === 'disconnected' && (
          <Button
            size="sm"
            onClick={() => handleAction(() => onConnect(session.name))}
            disabled={loading}
          >
            Conectar
          </Button>
        )}
        {session.status === 'connected' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleAction(() => onDisconnect(session.name))}
            disabled={loading}
          >
            Desconectar
          </Button>
        )}
        {session.status === 'qr_pending' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShowQR(session.name)}
            disabled={loading}
          >
            Ver QR Code
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction(() => onDelete(session.name))}
          disabled={loading}
        >
          Excluir
        </Button>
      </CardFooter>
    </Card>
  )
}
