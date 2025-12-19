"use client"

import { useState } from "react"
import { Search, Plus, Filter } from "lucide-react"
import { Ticket, Queue, Tag, User } from "@/lib/nats/nats-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketItem } from "./ticket-item"
import { ConnectionStatus } from "./connection-status"
import { QueueFilter } from "./queue-filter"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  tickets: (Ticket & { tags?: Tag[]; isGroup?: boolean })[]
  queues: Queue[]
  currentUser: User
  selectedTicketId: string | null
  selectedQueue: Queue | null
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
  onSelectTicket: (id: string) => void
  onSelectQueue: (queue: Queue | null) => void
  onNewTicket: () => void
}

export function ChatSidebar({
  tickets,
  queues,
  currentUser,
  selectedTicketId,
  selectedQueue,
  connectionStatus,
  onSelectTicket,
  onSelectQueue,
  onNewTicket
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<'waiting' | 'attending' | 'groups'>('attending')

  const filteredTickets = tickets.filter(t => {
    if (selectedQueue && selectedQueue.id !== 'all' && t.queue.id !== selectedQueue.id) return false
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!t.contactName.toLowerCase().includes(query) && !t.lastMessage.toLowerCase().includes(query)) {
        return false
      }
    }
    
    switch (activeTab) {
      case 'waiting':
        return t.status === 'open' && !t.assignedTo
      case 'attending':
        return t.status === 'pending' && t.assignedTo?.id === currentUser.id
      case 'groups':
        return t.isGroup === true
      default:
        return true
    }
  }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  const tabCounts = {
    waiting: tickets.filter(t => t.status === 'open' && !t.assignedTo).length,
    attending: tickets.filter(t => t.status === 'pending' && t.assignedTo?.id === currentUser.id).length,
    groups: tickets.filter(t => t.isGroup === true).length
  }

  return (
    <div className="w-full md:w-[320px] lg:w-[350px] border-r border-border flex flex-col bg-background shrink-0 h-full">
      <div className="bg-secondary/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            {currentUser.avatar && <AvatarImage src={currentUser.avatar} alt={currentUser.name} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onNewTicket} className="text-muted-foreground h-8 w-8">
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConnectionStatus 
        status={connectionStatus}
        phoneNumber="+55 11 99999-9999"
      />

      <div className="p-2 bg-background flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-[13px] rounded-md w-full"
          />
        </div>
        <QueueFilter
          queues={queues}
          selectedQueue={selectedQueue}
          onSelect={onSelectQueue}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'waiting' | 'attending' | 'groups')} className="w-full">
        <TabsList className="flex w-full h-9 rounded-none bg-background border-b border-border p-0">
          {[
            { id: 'waiting', label: 'Fila', color: 'bg-chart-4' },
            { id: 'attending', label: 'Meus', color: 'bg-chart-2' },
            { id: 'groups', label: 'Grupos', color: 'bg-chart-3' }
          ].map(tab => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className="flex-1 relative text-[12px] font-medium data-[state=active]:bg-background data-[state=active]:text-primary rounded-none h-full border-b-2 border-transparent data-[state=active]:border-primary transition-none px-0"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>{tab.label}</span>
                {tabCounts[tab.id as keyof typeof tabCounts] > 0 && (
                  <span className={cn(
                    "flex items-center justify-center rounded-full text-[9px] text-white font-bold min-w-[16px] h-[16px] px-1",
                    tab.color
                  )}>
                    {tabCounts[tab.id as keyof typeof tabCounts]}
                  </span>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <ScrollArea className="flex-1 bg-background">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-40">
            <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map(ticket => (
              <TicketItem
                key={ticket.id}
                ticket={ticket}
                isSelected={selectedTicketId === ticket.id}
                onSelect={onSelectTicket}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
