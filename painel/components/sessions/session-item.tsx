import Link from 'next/link'
import { Wifi, WifiOff, Loader2, ChevronRight, Trash2, Power, PowerOff } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Session, SessionStatus } from './types'

function getStatusColor(status: SessionStatus) {
  switch (status) {
    case 'connected':
      return 'bg-green-500'
    case 'disconnected':
      return 'bg-red-500'
    case 'connecting':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

function getStatusIcon(status: SessionStatus) {
  switch (status) {
    case 'connected':
      return <Wifi className="h-3.5 w-3.5 text-green-500" />
    case 'disconnected':
      return <WifiOff className="h-3.5 w-3.5 text-red-500" />
    case 'connecting':
      return <Loader2 className="h-3.5 w-3.5 text-yellow-500 animate-spin" />
    default:
      return null
  }
}

function getStatusLabel(status: SessionStatus) {
  switch (status) {
    case 'connected':
      return 'Conectado'
    case 'disconnected':
      return 'Desconectado'
    case 'connecting':
      return 'Conectando...'
    default:
      return status
  }
}

interface SessionItemProps {
  session: Session
  isLast?: boolean
  onConnect?: (id: string) => void
  onDisconnect?: (id: string) => void
  onDelete?: (id: string) => void
  onClick?: (id: string) => void
}

export function SessionItem({ session, isLast, onConnect, onDisconnect, onDelete, onClick }: SessionItemProps) {
  const displayName = session.pushName || session.session
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleClick = () => {
    if (onClick) {
      onClick(session.id)
    }
  }

  const ContentWrapper = onClick ? 'div' : Link
  const wrapperProps = onClick 
    ? { onClick: handleClick, className: "flex items-center gap-3 flex-1 min-w-0 cursor-pointer" }
    : { href: `/sessions/${session.session}`, className: "flex items-center gap-3 flex-1 min-w-0" }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50 ${
        !isLast ? 'border-b' : ''
      }`}
    >
      <ContentWrapper {...wrapperProps as any}>
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            {session.profilePicture && <AvatarImage src={session.profilePicture} alt={displayName} />}
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${getStatusColor(session.status)}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium truncate">{displayName}</h3>
            {getStatusIcon(session.status)}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {session.phone ? `+${session.phone}` : getStatusLabel(session.status)}
          </p>
        </div>

        {session.stats && session.status === 'connected' && (
          <div className="hidden sm:flex gap-3 text-xs text-muted-foreground shrink-0">
            <span>{session.stats.chats} chats</span>
            <span>{session.stats.contacts} contatos</span>
          </div>
        )}

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </ContentWrapper>

      <div className="flex items-center gap-1 shrink-0">
        {session.status === 'disconnected' ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onConnect?.(session.id)}
            title="Conectar"
          >
            <Power className="h-4 w-4" />
          </Button>
        ) : session.status === 'connected' ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            onClick={() => onDisconnect?.(session.id)}
            title="Desconectar"
          >
            <PowerOff className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete?.(session.id)}
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
