'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SessionHeader,
  SessionStats,
  SessionSearch,
  SessionFilters,
  SessionList,
  Session,
  StatusFilter,
} from '@/components/sessions'

const mockSessions: Session[] = [
  {
    id: '1',
    session: 'vendas',
    phone: '5511999991234',
    status: 'connected',
    pushName: 'Atendimento Vendas',
    stats: { messages: 1234, chats: 42, contacts: 156, groups: 12 },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    session: 'suporte',
    phone: '5511988885678',
    status: 'connected',
    pushName: 'Suporte Técnico',
    stats: { messages: 567, chats: 28, contacts: 89, groups: 5 },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    session: 'marketing',
    status: 'disconnected',
    pushName: 'Marketing',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    session: 'financeiro',
    status: 'connecting',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

export default function SessionsPage() {
  const [sessions] = useState<Session[]>(mockSessions)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => ({
    all: sessions.length,
    connected: sessions.filter(s => s.status === 'connected').length,
    disconnected: sessions.filter(s => s.status === 'disconnected').length,
    connecting: sessions.filter(s => s.status === 'connecting').length,
  }), [sessions])

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      const matchesSearch = search === '' || 
        s.session.toLowerCase().includes(search.toLowerCase()) ||
        s.pushName?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.includes(search)
      return matchesStatus && matchesSearch
    })
  }, [sessions, statusFilter, search])

  const handleConnect = (id: string) => {
    console.log('Connect:', id)
    // TODO: POST /:session/connect
  }

  const handleDisconnect = (id: string) => {
    console.log('Disconnect:', id)
    // TODO: POST /:session/disconnect
  }

  const handleDelete = (id: string) => {
    console.log('Delete:', id)
    // TODO: DELETE /:session
  }

  const handleNewSession = () => {
    console.log('New session')
    // TODO: POST /sessions
  }

  return (
    <div className="min-h-screen bg-background">
      <SessionHeader />

      <main className="px-5 py-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Sessões</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas conexões do WhatsApp</p>
        </div>

        <SessionStats
          total={counts.all}
          connected={counts.connected}
          disconnected={counts.disconnected}
        />

        <div className="flex items-center justify-between gap-2 mb-3">
          <SessionFilters
            value={statusFilter}
            onChange={setStatusFilter}
            counts={counts}
          />
          <Button onClick={handleNewSession} size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Nova Sessão
          </Button>
        </div>

        <SessionSearch value={search} onChange={setSearch} />

        <SessionList
          sessions={filteredSessions}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onDelete={handleDelete}
          emptyMessage={
            statusFilter !== 'all'
              ? `Nenhuma sessao ${statusFilter === 'connected' ? 'conectada' : statusFilter === 'disconnected' ? 'desconectada' : 'conectando'}`
              : search
              ? 'Nenhuma sessao encontrada para esta busca'
              : undefined
          }
        />
      </main>
    </div>
  )
}
