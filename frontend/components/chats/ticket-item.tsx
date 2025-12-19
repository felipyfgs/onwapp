"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Ticket } from "@/lib/nats/nats-types"

interface TicketItemProps {
  ticket: Ticket
  isSelected: boolean
  onSelect: (id: string) => void
  className?: string
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

const getStatusBadgeProps = (status: 'open' | 'pending' | 'closed' | 'scheduled') => {
  const props = {
    open: { variant: 'default' as const, text: 'Aguardando' },
    pending: { variant: 'secondary' as const, text: 'Em Aberto' },
    closed: { variant: 'outline' as const, text: 'Resolvido' },
    scheduled: { variant: 'outline' as const, text: 'Agendado' }
  }
  return props[status]
}

export function TicketItem({ ticket, isSelected, onSelect, className = "" }: TicketItemProps) {
  const status = getStatusBadgeProps(ticket.status)
  
  return (
    <button
      className={`w-full flex items-center gap-3 p-4 border-b border-muted/30 text-left hover:bg-muted/40 ${
        isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
      } ${className}`}
      onClick={() => onSelect(ticket.id)}
    >
      {/* Avatar - 40px */}
      <Avatar className="h-10 w-10 shrink-0 border">
        <AvatarImage 
          src={`https://ui-avatars.com/api/?name=${ticket.contactName}&background=${ticket.queue.color.replace('#', '')}&color=fff`} 
        />
        <AvatarFallback className="text-xs">{getInitials(ticket.contactName)}</AvatarFallback>
      </Avatar>
      
      {/* Content - Flexible */}
      <div className="flex-1 min-w-0">
        {/* Line 1: Name + Time */}
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="font-semibold text-sm truncate text-foreground/90">{ticket.contactName}</span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(ticket.updatedAt)}
          </span>
        </div>
        
        {/* Line 2: Message (max 1 line) */}
        <p className="text-xs text-muted-foreground truncate line-clamp-1 mb-1.5">
          {ticket.lastMessage}
        </p>
        
        {/* Line 3: Badges + Unread */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className="text-[10px] px-2 py-0 h-5 font-medium uppercase tracking-wider">
              {status.text}
            </Badge>
            <span className="text-sm opacity-80" title={ticket.queue.name}>
              {ticket.queue.icon}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {ticket.assignedTo && (
              <div className="flex -space-x-1">
                <Avatar className="h-4 w-4 border border-background">
                  <AvatarFallback className="text-[7px]">{getInitials(ticket.assignedTo.name)}</AvatarFallback>
                </Avatar>
              </div>
            )}
            {ticket.unreadCount > 0 && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5 min-w-[20px] justify-center bg-green-500 hover:bg-green-600 border-none shadow-sm">
                {ticket.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}