import { Smartphone, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Session } from './types'
import { SessionItem } from './session-item'

interface SessionListProps {
  sessions: Session[]
  onConnect?: (id: string) => void
  onDisconnect?: (id: string) => void
  onDelete?: (id: string) => void
  onSessionClick?: (id: string) => void
  onCreateSession?: () => void
  emptyMessage?: string
}

export function SessionList({ 
  sessions, 
  onConnect, 
  onDisconnect, 
  onDelete, 
  onSessionClick,
  onCreateSession,
  emptyMessage 
}: SessionListProps) {
  if (sessions.length === 0) {
    const isFiltered = emptyMessage && emptyMessage !== 'Crie uma nova sessao para comecar'
    
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="mx-auto mb-4 rounded-full bg-muted p-4 w-fit">
          <Smartphone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">
          {isFiltered ? 'Nenhuma sessao encontrada' : 'Nenhuma sessao'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {emptyMessage || 'Crie uma nova sessao para comecar'}
        </p>
        {!isFiltered && onCreateSession && (
          <Button onClick={onCreateSession}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Sessao
          </Button>
        )}
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
          onClick={onSessionClick}
        />
      ))}
    </div>
  )
}
