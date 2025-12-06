'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Session, SessionStatus } from '@/types/session'
import { getSessions } from '@/lib/actions/sessions'
import { SessionsTable } from './components/sessions-table'
import { SessionsFilters } from './components/sessions-filters'
import { CreateSessionDialog } from './components/create-session-dialog'
import { APIStatusIndicator } from './components/api-status-indicator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Toaster } from 'sonner'
import { 
  Smartphone, 
  MessageSquare, 
  Users, 
  User, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Activity,
  RefreshCw,
  Zap
} from 'lucide-react'

interface SessionStats {
  total: number
  connected: number
  connecting: number
  disconnected: number
  totalMessages: number
  totalChats: number
  totalContacts: number
  totalGroups: number
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchSessions = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const data = await getSessions()
      setSessions(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(() => fetchSessions(), 30000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const stats: SessionStats = useMemo(() => {
    return sessions.reduce((acc, session) => {
      acc.total++
      acc[session.status]++
      
      if (session.stats) {
        acc.totalMessages += session.stats.messages
        acc.totalChats += session.stats.chats
        acc.totalContacts += session.stats.contacts
        acc.totalGroups += session.stats.groups
      }
      
      return acc
    }, {
      total: 0,
      connected: 0,
      connecting: 0,
      disconnected: 0,
      totalMessages: 0,
      totalChats: 0,
      totalContacts: 0,
      totalGroups: 0,
    })
  }, [sessions])

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        search === '' ||
        session.session.toLowerCase().includes(search.toLowerCase()) ||
        session.phone?.toLowerCase().includes(search.toLowerCase()) ||
        session.pushName?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || session.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [sessions, search, statusFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Sessões</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas conexões WhatsApp</p>
            </div>
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </header>
        <main className="container py-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Toaster position="top-right" richColors closeButton />
      
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/20">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-gray-900">Sessoes WhatsApp</h1>
                  <p className="text-xs text-gray-500">
                    {stats.total} sessoes • {stats.connected} conectadas
                  </p>
                </div>
              </div>
              <APIStatusIndicator />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSessions(true)}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <CreateSessionDialog onCreated={() => fetchSessions()} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {lastUpdate && (
          <p className="text-xs text-gray-400 mb-4">
            Ultima atualizacao: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Sessoes</CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Smartphone className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{stats.total}</div>
              <div className="flex gap-2 mt-3">
                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100 border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats.connected} ativas
                </Badge>
                <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100 border-0">
                  <XCircle className="h-3 w-3 mr-1" />
                  {stats.disconnected} off
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Mensagens</CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{stats.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Total enviadas</p>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500" style={{width: `${Math.min(stats.totalMessages / 100, 100)}%`}} />
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Chats</CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{stats.totalChats.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Conversas ativas</p>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500" style={{width: `${Math.min(stats.totalChats / 50, 100)}%`}} />
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Contatos</CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
                <User className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{stats.totalContacts.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.totalGroups} grupos</p>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500" style={{width: `${Math.min(stats.totalContacts / 100, 100)}%`}} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        {stats.total > 0 && (
          <Card className="border-0 bg-white shadow-md mb-8 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                Visao Geral de Conexoes
              </CardTitle>
              <CardDescription className="text-gray-500">Status atual das sessoes WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="group flex items-center space-x-4 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-100 hover:border-green-200 hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 p-3 bg-green-500 rounded-xl shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-900">Conectadas</p>
                    <p className="text-sm text-green-600 truncate">
                      {stats.connected} sessao{stats.connected !== 1 ? 'es' : ''} ativas
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{stats.connected}</div>
                </div>
                
                <div className="group flex items-center space-x-4 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-900">Conectando</p>
                    <p className="text-sm text-amber-600 truncate">
                      {stats.connecting} em processo
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-amber-600">{stats.connecting}</div>
                </div>
                
                <div className="group flex items-center space-x-4 p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl border border-red-100 hover:border-red-200 hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 p-3 bg-red-500 rounded-xl shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-900">Desconectadas</p>
                    <p className="text-sm text-red-600 truncate">
                      {stats.disconnected} offline
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-red-600">{stats.disconnected}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Table */}
        <div className="space-y-4">
          <Card className="border-0 bg-white shadow-md">
            <CardContent className="p-4">
              <SessionsFilters
                search={search}
                onSearchChange={setSearch}
                status={statusFilter}
                onStatusChange={setStatusFilter}
              />
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Lista de Sessoes
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {filteredSessions.length !== sessions.length 
                      ? `Mostrando ${filteredSessions.length} de ${sessions.length} sessoes`
                      : `${sessions.length} sessao${sessions.length !== 1 ? 'es' : ''} encontrada${sessions.length !== 1 ? 's' : ''}`
                    }
                  </CardDescription>
                </div>
                <Badge className="bg-gray-900 text-white hover:bg-gray-800">
                  {filteredSessions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <SessionsTable sessions={filteredSessions} onUpdate={() => fetchSessions()} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
