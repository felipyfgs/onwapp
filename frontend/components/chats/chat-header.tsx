"use client"

import { Ticket, Queue, User } from "@/lib/nats/nats-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, CheckCircle2 } from "lucide-react"
import { TransferMenu } from "./transfer-menu"
import { Separator } from "@/components/ui/separator"
import { MoreVertical } from "lucide-react"

interface ChatHeaderProps {
  ticket: Ticket & { isGroup?: boolean }
  queues: Queue[]
  users: User[]
  currentUser: User
  onBack: () => void
  onAccept: (ticketId: string) => void
  onResolve: (ticketId: string) => void
  onReopen: (ticketId: string) => void
  onTransferToQueue: (ticketId: string, queueId: string) => void
  onTransferToUser: (ticketId: string, userId: string) => void
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function ChatHeader({ 
  ticket, 
  queues,
  users,
  currentUser,
  onBack, 
  onAccept, 
  onResolve, 
  onReopen,
  onTransferToQueue,
  onTransferToUser
}: ChatHeaderProps) {
  const canAccept = ticket.status === 'open' && (!ticket.assignedTo || ticket.assignedTo.id !== currentUser.id)
  const canResolve = (ticket.status === 'pending' || ticket.status === 'open') && ticket.assignedTo?.id === currentUser.id
  const canReopen = ticket.status === 'closed'
  
  return (
    <div className="h-16 border-b border-border bg-secondary/50 flex items-center px-4 gap-3 shrink-0">
      <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden shrink-0" onClick={onBack}>
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <div className="relative shrink-0 cursor-pointer">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.contactName)}&background=${ticket.queue.color.replace('#', '')}&color=fff`} 
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {getInitials(ticket.contactName)}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0 cursor-pointer">
        <h3 className="text-foreground font-semibold text-[15px] truncate leading-tight">
          {ticket.contactName}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {ticket.status === 'pending' ? 'em atendimento' : 'online'}
        </p>
      </div>
      
      <div className="flex items-center gap-0.5 shrink-0">
        {canAccept && (
          <Button 
            size="sm" 
            onClick={() => onAccept(ticket.id)} 
            className="hidden sm:flex h-8 px-3 text-xs bg-chart-2 hover:bg-chart-2/90 text-white font-medium"
          >
            Aceitar
          </Button>
        )}
        {canResolve && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onResolve(ticket.id)} 
            className="hidden sm:flex h-8 px-3 text-xs border-chart-2 text-chart-2 hover:bg-chart-2/10 font-medium"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Resolver
          </Button>
        )}
        {canReopen && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onReopen(ticket.id)} 
            className="hidden sm:flex h-8 px-3 text-xs border-primary text-primary hover:bg-primary/10 font-medium"
          >
            Reabrir
          </Button>
        )}
        
        <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block bg-border" />
        
        <TransferMenu
          queues={queues}
          users={users}
          currentQueueId={ticket.queue.id}
          currentUserId={ticket.assignedTo?.id}
          onTransferToQueue={(queueId) => onTransferToQueue(ticket.id, queueId)}
          onTransferToUser={(userId) => onTransferToUser(ticket.id, userId)}
        />
        
        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
