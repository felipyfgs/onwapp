import { Smartphone } from 'lucide-react'
import { Session } from './types'
import { SessionItem } from './session-item'

interface SessionListProps {
  sessions: Session[]
  onConnect?: (id: string) => void
  onDisconnect?: (id: string) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
}

export function SessionList({ sessions, onConnect, onDisconnect, onDelete, emptyMessage }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="mx-auto mb-4 rounded-full bg-muted p-4 w-fit">
          <Smartphone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">Nenhuma sessao encontrada</h3>
        <p className="text-sm text-muted-foreground">
          {emptyMessage || 'Crie uma nova sessao para comecar'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {sessions.map((session, index) => (
        <SessionItem
          key={session.id}
          session={session}
          isLast={index === sessions.length - 1}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
