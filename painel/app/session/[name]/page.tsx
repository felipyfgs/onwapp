'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { IconRefresh } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getSessionStatus,
  connectSession,
  disconnectSession,
  getSessionQR,
} from '@/lib/api'

interface SessionInfo {
  status: string
  phone?: string
  version?: string
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = use(params)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSessionStatus(name)
      setSession({
        status: data.status,
        version: data.version,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessao')
    } finally {
      setLoading(false)
    }
  }, [name])

  const fetchQR = useCallback(async () => {
    try {
      const data = await getSessionQR(name)
      setQrCode(data.qr)
    } catch {
      setQrCode(null)
    }
  }, [name])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (session?.status === 'connecting' || session?.status === 'qr_pending') {
      fetchQR()
      const interval = setInterval(fetchQR, 5000)
      return () => clearInterval(interval)
    }
  }, [session?.status, fetchQR])

  const handleConnect = async () => {
    try {
      await connectSession(name)
      setSession((prev) => prev ? { ...prev, status: 'connecting' } : null)
      setTimeout(fetchSession, 2000)
    } catch (err) {
      console.error('Erro ao conectar:', err)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectSession(name)
      setSession((prev) => prev ? { ...prev, status: 'disconnected' } : null)
    } catch (err) {
      console.error('Erro ao desconectar:', err)
    }
  }

  const statusColor = {
    connected: 'default',
    disconnected: 'destructive',
    connecting: 'secondary',
    qr_pending: 'secondary',
  } as const

  const statusLabel = {
    connected: 'Conectado',
    disconnected: 'Desconectado',
    connecting: 'Conectando...',
    qr_pending: 'Aguardando QR',
  } as const

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchSession} variant="outline">
          <IconRefresh className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{name}</h2>
          <p className="text-muted-foreground">Detalhes da sessao</p>
        </div>
        <Button onClick={fetchSession} variant="outline" size="sm">
          <IconRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Status</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Badge variant={statusColor[session?.status as keyof typeof statusColor] || 'secondary'}>
                {statusLabel[session?.status as keyof typeof statusLabel] || session?.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex gap-2">
            {session?.status === 'disconnected' && (
              <Button size="sm" onClick={handleConnect}>
                Conectar
              </Button>
            )}
            {session?.status === 'connected' && (
              <Button size="sm" variant="secondary" onClick={handleDisconnect}>
                Desconectar
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Versao</CardDescription>
            <CardTitle className="text-xl">
              {session?.version || 'N/A'}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Telefone</CardDescription>
            <CardTitle className="text-xl">
              {session?.phone || 'Nao conectado'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {qrCode && (session?.status === 'connecting' || session?.status === 'qr_pending') && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>
              Escaneie o QR Code com o WhatsApp para conectar
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCode}
              alt="QR Code"
              className="max-w-xs rounded-lg border"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
