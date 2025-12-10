"use client"

import { Session } from "./types"
import { SessionCard } from "./session-card"
import { SessionEmptyState } from "./session-empty-state"

interface SessionListProps {
  sessions: Session[]
  hasFilters: boolean
  onSessionCreated?: () => void
}

export function SessionList({ sessions, hasFilters, onSessionCreated }: SessionListProps) {
  if (sessions.length === 0) {
    return <SessionEmptyState hasFilters={hasFilters} onSessionCreated={onSessionCreated} />
  }

  return (
    <ul className="border border-border rounded-md divide-y divide-border">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} onUpdate={onSessionCreated} />
      ))}
    </ul>
  )
}
