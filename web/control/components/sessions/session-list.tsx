"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

import {
  Session,
  getSessions,
  connectSession,
  disconnectSession,
  deleteSession,
} from "@/lib/api/sessions"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SessionCard } from "./session-card"

export function SessionList() {
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchSessions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No sessions yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first WhatsApp session to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchSessions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
