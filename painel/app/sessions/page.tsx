"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Smartphone, 
  Plus, 
  Search, 
  RefreshCw,
  Zap,
  MoreVertical,
  Power,
  PowerOff,
  Trash2,
  Settings,
  ChevronRight,
  MessageSquare,
  Users,
  Hash,
  Filter,
  X,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth/context"
import type { Session } from "@/lib/types/session"
import {
  fetchSessions,
  createSession,
  deleteSession,
  connectSession,
  disconnectSession,
  RateLimitError,
} from "@/lib/api/sessions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SessionsListPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const isLoadingRef = useRef(false)
  const rateLimitedRef = useRef(false)

  const loadSessions = useCallback(async (isManual = false) => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current && !isManual) return
    
    // Don't auto-refresh if rate limited
    if (rateLimitedRef.current && !isManual) return

    if (isManual) {
      setRefreshing(true)
    }
    isLoadingRef.current = true

    try {
      const data = await fetchSessions()
      setSessions(data)
      setRateLimited(false)
      rateLimitedRef.current = false
      setRetryAfter(null)
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
      
      if (error instanceof RateLimitError) {
        setRateLimited(true)
        rateLimitedRef.current = true
        if (error.retryAfter) {
          setRetryAfter(error.retryAfter)
          // Auto-retry after the specified time
          setTimeout(() => {
            setRateLimited(false)
            rateLimitedRef.current = false
            setRetryAfter(null)
          }, error.retryAfter * 1000)
        }
        
        const message = error.retryAfter 
          ? `Limite excedido. Tente novamente em ${error.retryAfter} segundos.`
          : "Limite de requisições excedido. Aguarde um momento."
        toast.error(message, { duration: 5000 })
      } else {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar sessões")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      isLoadingRef.current = false
    }
  }, [])

  useEffect(() => {
    loadSessions()
    // Increase interval to 60 seconds to reduce API calls
    const interval = setInterval(() => {
      if (!rateLimitedRef.current) {
        loadSessions()
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [loadSessions])

  const filteredSessions = sessions.filter((session) => {
    // Filter by search
    const matchesSearch = 
      session.session.toLowerCase().includes(search.toLowerCase()) ||
      session.phone?.toLowerCase().includes(search.toLowerCase()) ||
      session.pushName?.toLowerCase().includes(search.toLowerCase())
    
    // Filter by status
    const matchesStatus = !statusFilter || session.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleCreateSession = async (sessionName: string) => {
    try {
      await createSession({ session: sessionName })
      toast.success("Sessão criada com sucesso")
      await loadSessions()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar sessão")
      throw error
    }
  }

  const handleConnect = async (e: React.MouseEvent, sessionName: string) => {
    e.stopPropagation()
    try {
      await connectSession(sessionName)
      toast.success("Conectando sessão...")
      await loadSessions()
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar sessão")
    }
  }

  const handleDisconnect = async (e: React.MouseEvent, sessionName: string) => {
    e.stopPropagation()
    try {
      await disconnectSession(sessionName)
      toast.success("Sessão desconectada")
      await loadSessions()
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar sessão")
    }
  }

  const handleDelete = async (e: React.MouseEvent, sessionName: string) => {
    e.stopPropagation()
    if (!confirm(`Tem certeza que deseja deletar a sessão "${sessionName}"?`)) {
      return
    }
    try {
      await deleteSession(sessionName)
      toast.success("Sessão deletada")
      await loadSessions()
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar sessão")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-primary"
      case "connecting":
        return "bg-chart-4"
      case "disconnected":
        return "bg-destructive"
      default:
        return "bg-muted-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado"
      case "connecting":
        return "Conectando..."
      case "disconnected":
        return "Desconectado"
      default:
        return status
    }
  }

  const connectedCount = sessions.filter(s => s.status === "connected").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground">OnWApp</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => loadSessions(true)}
                disabled={refreshing || rateLimited}
                title={rateLimited ? "Aguarde antes de atualizar novamente" : "Atualizar"}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
              <ModeToggle />
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-4 sm:px-6 py-4">
        {/* Stats Bar */}
        <div className="mb-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium text-foreground">{sessions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Conectadas:</span>
              <span className="font-medium text-primary">{connectedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Offline:</span>
              <span className="font-medium text-destructive">{sessions.length - connectedCount}</span>
            </div>
          </div>
            {rateLimited && (
              <div className="text-xs text-muted-foreground">
                {retryAfter ? `Aguarde ${retryAfter}s` : "Limite excedido"}
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-3 space-y-2">
          {/* Search */}
          <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar sessão..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/50 border-0 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                <span>Status:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  variant={statusFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === "connected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("connected")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Conectado
                </Button>
                <Button
                  variant={statusFilter === "connecting" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("connecting")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-chart-4" />
                  Conectando
                </Button>
                <Button
                  variant={statusFilter === "disconnected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("disconnected")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  Desconectado
                </Button>
                {statusFilter && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setStatusFilter(null)}
                    title="Limpar filtro"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <CreateSessionDialog onCreateSession={handleCreateSession} />
          </div>
        </div>

        {/* Sessions List */}
        <main className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Smartphone className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {search || statusFilter ? "Nenhuma sessão encontrada" : "Nenhuma sessão"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {search || statusFilter
                ? "Tente ajustar os filtros ou buscar com outros termos" 
                : "Crie sua primeira sessão para começar"
              }
            </p>
            {!search && !statusFilter && (
              <CreateSessionDialog onCreateSession={handleCreateSession} />
            )}
          </div>
        ) : (
          <>
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer bg-card hover:bg-muted/30 active:bg-muted/50 transition-colors border-b border-border last:border-0"
                onClick={() => router.push(`/sessions/${session.session}`)}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {session.profilePicture ? (
                    <img 
                      src={session.profilePicture} 
                      alt={session.pushName || session.session}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span 
                    className={cn(
                      "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
                      getStatusColor(session.status)
                    )} 
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-foreground truncate">{session.session}</h3>
                      <span className={cn(
                        "text-xs flex-shrink-0 whitespace-nowrap",
                        session.status === "connected" ? "text-primary" : "text-muted-foreground"
                      )}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                      {session.pushName && (
                        <span className="truncate">{session.pushName}</span>
                      )}
                      {session.phone && (
                        <span className="truncate">{session.phone}</span>
                      )}
                      {session.stats && (
                        <>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <MessageSquare className="h-3 w-3" />
                            {session.stats.messages}
                          </span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Hash className="h-3 w-3" />
                            {session.stats.chats}
                          </span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Users className="h-3 w-3" />
                            {session.stats.contacts}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/sessions/${session.session}`)
                      }}>
                        <Settings />
                        Configurações
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {session.status === "connected" ? (
                        <DropdownMenuItem onClick={(e) => handleDisconnect(e, session.session)}>
                          <PowerOff />
                          Desconectar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={(e) => handleConnect(e, session.session)}>
                          <Power />
                          Conectar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => handleDelete(e, session.session)}
                      >
                        <Trash2 />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}

            {/* Add new session */}
            <div
              className="flex items-center gap-3 px-4 py-2 cursor-pointer bg-card hover:bg-muted/30 active:bg-muted/50 transition-colors border-t border-border"
              onClick={() => document.querySelector<HTMLButtonElement>('[data-create-session]')?.click()}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">Nova Sessão</p>
                <p className="text-xs text-muted-foreground/70">Criar uma nova conexão</p>
              </div>
            </div>
          </>
        )}
        </main>
      </div>
    </div>
  )
}
