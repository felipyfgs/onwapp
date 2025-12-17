"use client"

import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { RefreshCw, WifiOff, Users } from "lucide-react"

import {
  Session,
  getSessions,
  connectSession,
  disconnectSession,
  deleteSession,
} from "@/lib/api/sessions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SessionItem } from "./session-item"

export interface SessionListRef {
  refresh: () => void
}

interface SessionListProps {
  searchTerm?: string
  statusFilter?: "all" | "connected" | "connecting" | "disconnected"
}

export const SessionList = forwardRef<SessionListRef, SessionListProps>(function SessionList({ searchTerm = "", statusFilter = "all" }, ref) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchSessions() {
    setLoading(true)
    setError(null)
    const response = await getSessions()
    if (response.success && response.data) {
      setSessions(response.data)
    } else {
      setError(response.error || "Failed to fetch sessions")
    }
    setLoading(false)
  }

  useImperativeHandle(ref, () => ({
    refresh: fetchSessions,
  }))

  useEffect(() => {
    fetchSessions()
  }, [])

  async function handleConnect(session: Session) {
    const response = await connectSession(session.session)
    if (response.success) {
      fetchSessions()
    }
  }

  async function handleDisconnect(session: Session) {
    const response = await disconnectSession(session.session)
    if (response.success) {
      fetchSessions()
    }
  }

  async function handleDelete(session: Session) {
    if (!confirm(`Delete session "${session.session}"?`)) return
    const response = await deleteSession(session.session)
    if (response.success) {
      fetchSessions()
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 text-center">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Erro ao carregar</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={fetchSessions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Nenhuma sessão ainda</h3>
          <p className="text-sm text-muted-foreground">
            Crie sua primeira sessão WhatsApp para começar.
          </p>
        </div>
      </div>
    )
  }

  // Apply filters
  const filteredSessions = sessions.filter(session => {
    // Status filter
    if (statusFilter !== "all" && session.status !== statusFilter) {
      return false
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      return (
        session.session.toLowerCase().includes(term) ||
        (session.pushName?.toLowerCase().includes(term)) ||
        (session.phone?.toLowerCase().includes(term))
      )
    }
    
    return true
  })

  return (
    <div className="space-y-4">
      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {searchTerm || statusFilter !== "all" 
              ? "Nenhum resultado encontrado" 
              : "Nenhuma sessão criada ainda"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
})
