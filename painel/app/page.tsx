'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { IconSearch, IconRefresh, IconInbox } from '@tabler/icons-react'
import { SessionsTable } from '@/components/sessions-table'
import { ThemeToggle } from '@/components/theme-toggle'
import { StatsCards } from '@/components/stats-cards'
import { CreateSessionDialog } from '@/components/create-session-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Session, SessionStatusType } from '@/lib/types'
import {
  getSessions,
  connectSession,
  disconnectSession,
  deleteSession,
} from '@/lib/api'

type FilterStatus = 'all' | SessionStatusType

export default function Home() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSessions()
      const mapped: Session[] = data.map((s) => ({
        id: s.id,
        name: s.session,
        status: s.status as SessionStatusType,
        phone: s.phone,
        deviceJid: s.deviceJid,
        apiKey: s.apiKey,
        pushName: s.pushName,
        profilePicture: s.profilePicture,
        stats: s.stats,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
      setSessions(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessoes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        session.name.toLowerCase().includes(search.toLowerCase()) ||
        session.phone?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        filterStatus === 'all' || session.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [sessions, search, filterStatus])

  const handleConnect = useCallback(async (name: string) => {
    try {
      await connectSession(name)
      setSessions((prev) =>
        prev.map((s) =>
          s.name === name ? { ...s, status: 'connecting' } : s
        )
      )
      setTimeout(fetchSessions, 2000)
    } catch (error) {
      console.error('Erro ao conectar:', error)
    }
  }, [fetchSessions])

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
    if (!confirm(`Deseja realmente excluir a sessao "${name}"?`)) return
    try {
      await deleteSession(name)
      setSessions((prev) => prev.filter((s) => s.name !== name))
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }, [])

  const handleShowQR = useCallback((name: string) => {
    router.push(`/session/${name}`)
  }, [router])

  const handleCreateSession = useCallback(async () => {
    // Session already created by dialog, just refresh
    await fetchSessions()
  }, [fetchSessions])

  const handleRowClick = useCallback((session: Session) => {
    router.push(`/session/${session.name}`)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-bold text-sm">ZP</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">zpwoot</h1>
              <p className="text-xs text-muted-foreground">WhatsApp Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CreateSessionDialog onCreateSession={handleCreateSession} />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto space-y-6 p-4 lg:p-6">
          {/* Stats */}
          <StatsCards sessions={sessions} />

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar sessao..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as FilterStatus)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="connected">Conectados</SelectItem>
                  <SelectItem value="disconnected">Desconectados</SelectItem>
                  <SelectItem value="connecting">Conectando</SelectItem>
                  <SelectItem value="qr_pending">Aguardando QR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessions}
              disabled={loading}
            >
              <IconRefresh className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Sessions Table */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <div className="mb-4 rounded-full bg-destructive/10 p-3">
                <IconInbox className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-medium">Erro ao carregar</h3>
              <p className="mb-4 text-sm text-muted-foreground">{error}</p>
              <Button onClick={fetchSessions} variant="outline">
                <IconRefresh className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : filteredSessions.length === 0 && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <div className="mb-4 rounded-full bg-muted p-3">
                <IconInbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhuma sessao</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Crie sua primeira sessao para comecar
              </p>
              <CreateSessionDialog onCreateSession={handleCreateSession} />
            </div>
          ) : (
            <SessionsTable
              sessions={filteredSessions}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onDelete={handleDelete}
              onShowQR={handleShowQR}
              onRowClick={handleRowClick}
            />
          )}
        </div>
      </main>
    </div>
  )
}
