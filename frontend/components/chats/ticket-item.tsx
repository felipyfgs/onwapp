"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Ticket, Tag } from "@/lib/nats/nats-types"
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

function MessagePreviewIcon({ type }: { type?: 'text' | 'image' | 'audio' | 'document' }) {
  if (!type || type === 'text') return null
  
  const icons = {
    image: <Image className="h-3 w-3 text-muted-foreground" alt="Imagem" />,
    audio: <Mic className="h-3 w-3 text-muted-foreground" alt="Áudio" />,
    document: <FileText className="h-3 w-3 text-muted-foreground" alt="Documento" />
  }
  
  return icons[type] || null
}

export function TicketItem({ ticket, isSelected, onSelect, className = "" }: TicketItemProps) {
  return (
    <button
      className={`w-full flex text-left transition-colors hover:bg-muted/50 ${
        isSelected ? 'bg-muted' : ''
      } ${className}`}
      onClick={() => onSelect(ticket.id)}
    >
      <div 
        className="w-1.5 shrink-0 self-stretch"
        style={{ backgroundColor: ticket.queue.color }}
      />
      
      <div className="flex-1 flex items-start gap-3 p-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.contactName)}&background=${ticket.queue.color.replace('#', '')}&color=fff`} 
              alt={ticket.contactName}
            />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {getInitials(ticket.contactName)}
            </AvatarFallback>
          </Avatar>
          
          {ticket.isGroup && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 shadow-sm">
              <Users className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[15px] truncate text-foreground">
              {ticket.contactName}
            </span>
            <span className={`text-[11px] whitespace-nowrap shrink-0 ${ticket.unreadCount > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              {formatRelativeTime(ticket.updatedAt)}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className="flex items-center gap-1 min-w-0">
              <MessagePreviewIcon type={ticket.lastMessageType} />
              <p className="text-[13px] text-muted-foreground truncate">
                {ticket.lastMessage}
              </p>
            </div>
            
            {ticket.unreadCount > 0 && (
              <Badge 
                className="text-[10px] px-1.5 py-0 h-5 min-w-[20px] justify-center bg-primary text-primary-foreground rounded-full border-none"
              >
                {ticket.unreadCount > 99 ? '99+' : ticket.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
