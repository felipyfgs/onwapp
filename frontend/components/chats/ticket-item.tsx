"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Ticket, Tag } from "@/lib/nats/nats-types"
import { TagBadges } from "./tag-badges"
import { Image, Mic, FileText, Users } from "lucide-react"

interface TicketItemProps {
  ticket: Ticket & { tags?: Tag[]; isGroup?: boolean; lastMessageType?: 'text' | 'image' | 'audio' | 'document' }
  isSelected: boolean
  onSelect: (id: string) => void
  className?: string
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getStatusConfig(status: 'open' | 'pending' | 'closed' | 'scheduled') {
  const config = {
    open: { variant: 'default' as const, text: 'Aguardando', dotClass: 'bg-chart-4' },
    pending: { variant: 'secondary' as const, text: 'Atendendo', dotClass: 'bg-chart-2' },
    closed: { variant: 'outline' as const, text: 'Resolvido', dotClass: 'bg-muted-foreground' },
    scheduled: { variant: 'outline' as const, text: 'Agendado', dotClass: 'bg-chart-5' }
  }
  return config[status]
}

function MessagePreviewIcon({ type }: { type?: 'text' | 'image' | 'audio' | 'document' }) {
  if (!type || type === 'text') return null
  
  const icons = {
    image: <Image className="h-3 w-3 text-muted-foreground" />,
    audio: <Mic className="h-3 w-3 text-muted-foreground" />,
    document: <FileText className="h-3 w-3 text-muted-foreground" />
  }
  
  return icons[type] || null
}

export function TicketItem({ ticket, isSelected, onSelect, className = "" }: TicketItemProps) {
  const statusConfig = getStatusConfig(ticket.status)
  
  return (
    <button
      className={`w-full flex text-left transition-colors hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      } ${className}`}
      onClick={() => onSelect(ticket.id)}
    >
      <div 
        className="w-1 shrink-0 self-stretch"
        style={{ backgroundColor: ticket.queue.color }}
      />
      
      <div className="flex-1 flex items-start gap-3 p-3">
        <div className="relative shrink-0">
          <Avatar 
            className="h-11 w-11 border-2 border-border"
            style={{ borderColor: isSelected ? ticket.queue.color : undefined }}
          >
            <AvatarImage 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.contactName)}&background=${ticket.queue.color.replace('#', '')}&color=fff`} 
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {getInitials(ticket.contactName)}
            </AvatarFallback>
          </Avatar>
          
          {ticket.isGroup && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
              <Users className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          
          <span 
            className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${statusConfig.dotClass}`}
          />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm truncate text-foreground">
              {ticket.contactName}
            </span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              {formatRelativeTime(ticket.updatedAt)}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <MessagePreviewIcon type={ticket.lastMessageType} />
            <p className="text-xs text-muted-foreground truncate flex-1">
              {ticket.lastMessage}
            </p>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0" title={ticket.queue.name}>
                {ticket.queue.icon}
              </span>
              {ticket.tags && ticket.tags.length > 0 && (
                <TagBadges tags={ticket.tags} maxVisible={2} size="sm" />
              )}
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {ticket.assignedTo && (
                <Avatar className="h-5 w-5 border border-background">
                  <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                    {getInitials(ticket.assignedTo.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              {ticket.unreadCount > 0 && (
                <Badge 
                  className="text-[10px] px-1.5 py-0 h-5 min-w-[20px] justify-center bg-primary text-primary-foreground animate-pulse"
                >
                  {ticket.unreadCount > 99 ? '99+' : ticket.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
