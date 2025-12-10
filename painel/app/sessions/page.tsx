"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Search, MessageSquare, LogOut, Settings, Book, Key, HelpCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import {
  Session,
  SessionStatus,
  FilterStatus,
  SessionStatsCards,
  SessionFiltersInline,
  SessionList,
} from "@/components/sessions"
import { getSessions, ApiSession } from "@/lib/api"

function mapApiSession(api: ApiSession): Session {
  return {
    id: api.id,
    session: api.session,
    deviceJid: api.deviceJid,
    phone: api.phone,
    status: api.status as SessionStatus,
    apiKey: api.apiKey,
    pushName: api.pushName,
    profilePicture: api.profilePicture,
    about: api.about,
    platform: api.platform,
    businessName: api.businessName,
    lastConnectedAt: api.lastConnectedAt,
    lastDisconnectedAt: api.lastDisconnectedAt,
    lastActivityAt: api.lastActivityAt,
    disconnectReason: api.disconnectReason,
    syncHistory: api.syncHistory,
    historySyncStatus: api.historySyncStatus,
    stats: api.stats,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [search, setSearch] = useState("")
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSessions()
      setSessions(data.map(mapApiSession))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar sessions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    fetchSessions()
  }, [isAuthenticated, router])

  const filteredSessions = sessions.filter((session) => {
    const matchesFilter = filter === "all" || session.status === filter
    const searchLower = search.toLowerCase()
    const matchesSearch = 
      session.session.toLowerCase().includes(searchLower) ||
      session.pushName?.toLowerCase().includes(searchLower) ||
      session.phone?.includes(search) ||
      session.id.toLowerCase().includes(searchLower)
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: sessions.length,
    connected: sessions.filter(s => s.status === "connected").length,
    disconnected: sessions.filter(s => s.status === "disconnected").length,
    connecting: sessions.filter(s => s.status === "connecting").length,
  }

  const hasFilters = search !== "" || filter !== "all"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b border-border bg-background px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">OnWapp</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Book className="mr-2 h-4 w-4" />
                Documentação
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Key className="mr-2 h-4 w-4" />
                API Keys
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Suporte
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-5 w-56" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-28" />
            </div>
            <Skeleton className="h-8" />
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive bg-muted p-4 text-center text-destructive">
            {error}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Sessões</h1>
              <span className="text-sm text-muted-foreground">— Gerencie suas conexões do WhatsApp</span>
            </div>

            <SessionStatsCards stats={stats} />
            
            <SessionFiltersInline
              stats={stats}
              filter={filter}
              onFilterChange={setFilter}
              onSessionCreated={fetchSessions}
            />

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar sessões..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            <SessionList sessions={filteredSessions} hasFilters={hasFilters} onSessionCreated={fetchSessions} />
          </>
        )}
      </main>
    </div>
  )
}
