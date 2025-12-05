"use client"

import * as React from "react"

import { Header } from "@/components/layout"
import { SessionsTable, CreateSessionDialog, QRCodeDialog } from "@/components/sessions"
import { getSessions } from "@/lib/actions"
import type { Session } from "@/types"

export default function HomePage() {
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchFilter, setSearchFilter] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [qrSession, setQrSession] = React.useState<Session | null>(null)
  const [showQR, setShowQR] = React.useState(false)

  const fetchSessions = React.useCallback(async () => {
    try {
      const data = await getSessions()
      setSessions(data)
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const handleShowQR = (session: Session) => {
    setQrSession(session)
    setShowQR(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        onSearch={setSearchFilter}
        onFilterStatus={setStatusFilter}
        showFilters
      />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sessoes</h1>
              <p className="text-muted-foreground">
                Gerencie suas sessoes do WhatsApp
              </p>
            </div>
            <CreateSessionDialog onCreated={fetchSessions} />
          </div>
          <SessionsTable
            sessions={sessions}
            loading={loading}
            onUpdate={fetchSessions}
            onShowQR={handleShowQR}
            searchFilter={searchFilter}
            statusFilter={statusFilter}
          />
        </div>
      </main>
      <QRCodeDialog
        session={qrSession}
        open={showQR}
        onOpenChange={setShowQR}
      />
    </div>
  )
}
