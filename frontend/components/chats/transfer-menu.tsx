"use client"

import { UserPlus, Users, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Queue, User } from "@/lib/nats/nats-types"

interface TransferMenuProps {
  queues: Queue[]
  users: User[]
  currentQueueId?: string
  currentUserId?: string
  onTransferToQueue: (queueId: string) => void
  onTransferToUser: (userId: string) => void
  disabled?: boolean
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function TransferMenu({
  queues,
  users,
  currentQueueId,
  currentUserId,
  onTransferToQueue,
  onTransferToUser,
  disabled = false
}: TransferMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled} className="h-9 w-9">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
        <DropdownMenuLabel className="text-muted-foreground text-xs uppercase tracking-wider">
          Transferir para
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuLabel className="text-muted-foreground text-xs flex items-center gap-2">
          <Inbox className="h-3 w-3" />
          Filas
        </DropdownMenuLabel>
        {queues.map(queue => (
          <DropdownMenuItem
            key={queue.id}
            onClick={() => onTransferToQueue(queue.id)}
            disabled={queue.id === currentQueueId}
            className="text-popover-foreground hover:bg-accent cursor-pointer"
          >
            <span 
              className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" 
              style={{ backgroundColor: queue.color }}
            />
            <span className="mr-1">{queue.icon}</span>
            <span className="flex-1">{queue.name}</span>
            {queue.id === currentQueueId && (
              <span className="text-xs text-muted-foreground">Atual</span>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuLabel className="text-muted-foreground text-xs flex items-center gap-2">
          <Users className="h-3 w-3" />
          Atendentes
        </DropdownMenuLabel>
        {users.map(user => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => onTransferToUser(user.id)}
            disabled={user.id === currentUserId}
            className="text-popover-foreground hover:bg-accent cursor-pointer"
          >
            <Avatar className="h-5 w-5 mr-2">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1">{user.name}</span>
            {user.id === currentUserId && (
              <span className="text-xs text-muted-foreground">Atual</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
