'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  SessionHeader,
  SessionStats,
  SessionSearch,
  SessionFilters,
  SessionList,
  Session,
  StatusFilter,
} from '@/components/sessions'
import { 
  getSessions, 
  createSession, 
  deleteSession,
  connectSession,
  disconnectSession,
} from '@/lib/api/sessions'

export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getSessions()
      setSessions(data.map(s => ({
        ...s,
        stats: s.stats || { messages: 0, chats: 0, contacts: 0, groups: 0 },
      })))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessões')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [fetchSessions])
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

  const handleConnect = async (id: string) => {
    const session = sessions.find(s => s.id === id)
    if (!session) return
    try {
      await connectSession(session.session)
      fetchSessions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao conectar')
    }
  }

  const handleDisconnect = async (id: string) => {
    const session = sessions.find(s => s.id === id)
    if (!session) return
    try {
      await disconnectSession(session.session)
      fetchSessions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao desconectar')
    }
  }

  const handleDelete = async (id: string) => {
    const session = sessions.find(s => s.id === id)
    if (!session) return
    if (!confirm(`Deseja excluir a sessão "${session.session}"?`)) return
    try {
      await deleteSession(session.session)
      fetchSessions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  const handleNewSession = () => {
    setNewSessionName('')
    setShowNewDialog(true)
  }

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return
    setCreating(true)
    try {
      const session = await createSession(newSessionName.trim())
      setShowNewDialog(false)
      // Redireciona para a pagina da sessao para escanear o QR
      router.push(`/sessions/${session.session}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar sessão')
      setCreating(false)
    }
  }

  const handleSessionClick = (id: string) => {
    const session = sessions.find(s => s.id === id)
    if (session) {
      router.push(`/sessions/${session.session}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SessionHeader />

      <main className="px-5 py-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Sessões</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas conexões do WhatsApp</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : (
          <>
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
              onSessionClick={handleSessionClick}
              onCreateSession={handleNewSession}
              emptyMessage={
                statusFilter !== 'all'
                  ? `Nenhuma sessao ${statusFilter === 'connected' ? 'conectada' : statusFilter === 'disconnected' ? 'desconectada' : 'conectando'}`
                  : search
                  ? 'Nenhuma sessao encontrada para esta busca'
                  : undefined
              }
            />
          </>
        )}
      </main>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Sessão</DialogTitle>
            <DialogDescription>
              Escolha um nome para identificar esta conexão
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Ex: Vendas, Suporte, Marketing"
              value={newSessionName}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '')
                setNewSessionName(value)
              }}
              onKeyDown={(e) => e.key === 'Enter' && !creating && newSessionName.trim() && handleCreateSession()}
              autoFocus
              className="text-base"
            />
            {newSessionName && !/^[a-zA-Z0-9-]+$/.test(newSessionName) && (
              <p className="text-xs text-destructive">
                Use apenas letras, números e hífens
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowNewDialog(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSession} disabled={creating || !newSessionName.trim()}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
