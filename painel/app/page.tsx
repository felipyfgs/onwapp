'use client'

import { useState, useCallback } from 'react'
import { SessionCard } from '@/components/session-card'
import { Button } from '@/components/ui/button'
import type { Session } from '@/lib/types'
import {
  connectSession,
  disconnectSession,
  deleteSession,
} from '@/lib/api'

const mockSessions: Session[] = [
  { name: 'session-01', status: 'connected', phone: '+55 11 99999-0001' },
  { name: 'session-02', status: 'disconnected' },
  { name: 'session-03', status: 'qr_pending' },
  { name: 'session-04', status: 'connecting' },
]

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>(mockSessions)
  const [loading, setLoading] = useState(false)

  const handleConnect = useCallback(async (name: string) => {
    try {
      await connectSession(name)
      setSessions((prev) =>
        prev.map((s) =>
          s.name === name ? { ...s, status: 'connecting' } : s
        )
      )
    } catch (error) {
      console.error('Erro ao conectar:', error)
    }
  }, [])

  const handleDisconnect = useCallback(async (name: string) => {
    try {
      await disconnectSession(name)
      setSessions((prev) =>
        prev.map((s) =>
          s.name === name ? { ...s, status: 'disconnected' } : s
        )
      )
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    }
  }, [])

  const handleDelete = useCallback(async (name: string) => {
    try {
      await deleteSession(name)
      setSessions((prev) => prev.filter((s) => s.name !== name))
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }, [])

  const handleShowQR = useCallback((name: string) => {
    console.log('Mostrar QR para:', name)
  }, [])

  const handleAddSession = useCallback(() => {
    const newName = `session-${String(sessions.length + 1).padStart(2, '0')}`
    setSessions((prev) => [
      ...prev,
      { name: newName, status: 'disconnected' },
    ])
  }, [sessions.length])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">zpwoot Manager</h1>
            <Button onClick={handleAddSession}>Nova Sessao</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Sessoes</h2>
          <p className="text-muted-foreground">
            Gerencie suas sessoes do WhatsApp
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhuma sessao encontrada
            </p>
            <Button onClick={handleAddSession}>Criar primeira sessao</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.name}
                session={session}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onDelete={handleDelete}
                onShowQR={handleShowQR}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
