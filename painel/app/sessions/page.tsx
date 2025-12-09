"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Loader2, Search, MessageSquare, LogOut, Settings, Book, Key, HelpCircle } from "lucide-react"
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    async function fetchSessions() {
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
    <>
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">OnWapp</span>
            <span className="text-xs text-muted-foreground leading-none mt-0.5">WhatsApp API</span>
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sessões</span>
          <span className="text-xs text-muted-foreground">
            ({sessions.length} {sessions.length === 1 ? "ativa" : "ativas"})
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Separator orientation="vertical" className="h-6" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
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

      <div className="flex flex-1 flex-col gap-4 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            {error}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-2xl font-bold">Sessões</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas conexões do WhatsApp</p>
            </div>

            <SessionStatsCards stats={stats} onFilterChange={setFilter} />
            
            <SessionFiltersInline
              stats={stats}
              filter={filter}
              onFilterChange={setFilter}
            />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar sessões..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <SessionList sessions={filteredSessions} hasFilters={hasFilters} />
          </>
        )}
      </div>
    </>
  )
}
