"use client"

import { Session } from "./types"
import { SessionCard } from "./session-card"
import { SessionEmptyState } from "./session-empty-state"

interface SessionListProps {
  sessions: Session[]
  hasFilters: boolean
}

export function SessionList({ sessions, hasFilters }: SessionListProps) {
  if (sessions.length === 0) {
    return <SessionEmptyState hasFilters={hasFilters} />
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {sessions.map((session, index) => (
        <SessionCard 
          key={session.id} 
          session={session} 
          isLast={index === sessions.length - 1}
        />
      ))}
    </div>
  )
}
