"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Search, UserPlus, CheckCircle2, RotateCcw, Send, Phone, Video, Info, ChevronLeft, X, Filter, ArrowUpDown, Paperclip, Smile } from "lucide-react"
import { useNats } from "@/lib/nats/nats-context"
import { Ticket, Queue, User, Message } from "@/lib/nats/nats-types"

// Components UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Remove component imports
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

// Chat components
import { QueueSelect } from "@/components/chats/queue-select"
import { StatusFilter } from "@/components/chats/status-filter"
import { TicketItem } from "@/components/chats/ticket-item"

// ========================================
// MOCK DATA
// ========================================

const currentUser: User = {
  id: "1",
  name: "Admin User",
  email: "admin@onwapp.com",
  avatar: "/avatars/admin.jpg"
}

const mockQueues: Queue[] = [
  { id: "support", name: "Suporte", color: "#10b981", icon: "🛠️" },
  { id: "sales", name: "Vendas", color: "#f59e0b", icon: "💰" },
  { id: "billing", name: "Financeiro", color: "#ef4444", icon: "💳" },
  { id: "all", name: "Todas", color: "#6366f1", icon: "📋" }
]

const mockTickets: Ticket[] = [
  {
    id: "ticket-1", contactName: "João Silva", contactNumber: "5511999999999",
    lastMessage: "Problema com integração da API", status: "open", queue: mockQueues[0],
    assignedTo: null, unreadCount: 3, createdAt: new Date(Date.now() - 3600000), updatedAt: new Date(Date.now() - 1800000)
  },
  {
    id: "ticket-2", contactName: "Maria Santos", contactNumber: "5511988888888",
    lastMessage: "Quero contratar plano enterprise", status: "pending", queue: mockQueues[1],
    assignedTo: currentUser, unreadCount: 1, createdAt: new Date(Date.now() - 7200000), updatedAt: new Date(Date.now() - 3600000)
  },
  {
    id: "ticket-3", contactName: "Pedro Costa", contactNumber: "5511977777777",
    lastMessage: "Dúvida sobre fatura do mês", status: "pending", queue: mockQueues[2],
    assignedTo: { id: "2", name: "Ana Rodrigues", email: "ana@onwapp.com" }, unreadCount: 5,
    createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(Date.now() - 7200000)
  },
  {
    id: "ticket-4", contactName: "Carlos Albuquerque", contactNumber: "5511966666666",
    lastMessage: "Erro ao fazer login no sistema", status: "open", queue: mockQueues[0],
    assignedTo: null, unreadCount: 0, createdAt: new Date(Date.now() - 1800000), updatedAt: new Date(Date.now() - 600000)
  },
  {
    id: "ticket-5", contactName: "Fernanda Lima", contactNumber: "5511955555555",
    lastMessage: "Preciso de ajuda com relatórios", status: "closed", queue: mockQueues[0],
    assignedTo: currentUser, unreadCount: 0, createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 86400000), closedAt: new Date(Date.now() - 86400000)
  },
  {
    id: "ticket-6", contactName: "Rafael Souza", contactNumber: "5511944444444",
    lastMessage: "Orçamento para 50 usuários", status: "scheduled", queue: mockQueues[1],
    assignedTo: currentUser, unreadCount: 0, createdAt: new Date(Date.now() - 5400000), updatedAt: new Date(Date.now() - 2400000)
  }
]

const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@onwapp.com" },
  { id: "2", name: "Ana Rodrigues", email: "ana@onwapp.com" },
  { id: "3", name: "João Silva", email: "joao@onwapp.com" }
]

// ========================================
// HELPER FUNCTIONS
// ========================================

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ========================================
// SUB-COMPONENTS
// ========================================

// REMOVED - Now using imported component

// REMOVED - Now using imported component

// REMOVED - Now using imported component

function ChatHeader({ ticket, onBack, onAccept, onResolve, onReopen, onAssign }: {
  ticket: Ticket
  onBack: () => void
  onAccept: (ticketId: string) => void
  onResolve: (ticketId: string) => void
  onReopen: (ticketId: string) => void
  onAssign: (ticketId: string, userId: string) => void
}) {
  const canAccept = ticket.status === 'open' && (!ticket.assignedTo || ticket.assignedTo.id !== currentUser.id)
  const canResolve = (ticket.status === 'pending' || ticket.status === 'open') && ticket.assignedTo?.id === currentUser.id
  const canReopen = ticket.status === 'closed'
  
  const handleAssign = (userId: string) => {
    onAssign(ticket.id, userId)
  }
  
  return (
    <div className="h-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6">
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left: Back + Avatar + Name */}
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" className="h-10 w-10 md:hidden -ml-2" onClick={onBack}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Avatar className="h-12 w-12 border-2 border-muted shadow-sm">
            <AvatarImage 
              src={`https://ui-avatars.com/api/?name=${ticket.contactName}&background=${ticket.queue.color.replace('#', '')}&color=fff`} 
            />
            <AvatarFallback>{getInitials(ticket.contactName)}</AvatarFallback>
          </Avatar>
          
          <div className="min-w-0">
            <h3 className="font-bold text-base truncate leading-none mb-1.5">{ticket.contactName}</h3>
            <div className="flex items-center gap-2">
               <Badge variant={ticket.status === 'closed' ? 'outline' : 'secondary'} className="text-[10px] px-2 h-4 font-bold uppercase">
                {ticket.status === 'open' ? 'Aguardando' : ticket.status === 'pending' ? 'Em Aberto' : ticket.status === 'scheduled' ? 'Agendado' : 'Resolvido'}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border">
                <span>{ticket.queue.icon}</span>
                <span className="font-medium">{ticket.queue.name}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Main Status Actions */}
          <div className="hidden sm:flex items-center gap-2">
            {canAccept && (
              <Button size="sm" onClick={() => onAccept(ticket.id)} className="h-10 px-6 font-semibold shadow-sm">
                Aceitar Ticket
              </Button>
            )}
            {canResolve && (
              <Button size="sm" variant="outline" onClick={() => onResolve(ticket.id)} className="h-10 px-4 font-semibold border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Resolver
              </Button>
            )}
            {canReopen && (
              <Button size="sm" variant="outline" onClick={() => onReopen(ticket.id)} className="h-10 px-4 font-semibold">
                Reabrir Ticket
              </Button>
            )}
          </div>

          <Separator orientation="vertical" className="h-10 mx-2 hidden sm:block" />

          {/* Tools */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Info className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 ml-1 hover:bg-muted">
                   <UserPlus className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs uppercase tracking-widest opacity-70">Transferir Para</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {mockUsers.map(user => (
                  <DropdownMenuItem key={user.id} onClick={() => handleAssign(user.id, user.id)} className="py-2 px-3 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                    {ticket.assignedTo?.id === user.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isMyMessage = message.sender === 'me'
  
  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
        isMyMessage 
          ? 'bg-primary text-primary-foreground rounded-br-none' 
          : 'bg-muted text-foreground rounded-bl-none'
      }`}>
        <div className="text-sm">{message.content}</div>
        <div className={`text-xs mt-1 opacity-70 flex items-center gap-1`}>
          {formatTime(message.timestamp)}
          {isMyMessage && message.status && (
            <span className="ml-1">{message.status === 'read' ? '✓✓' : '✓'}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageList({ messages, hasChat }: { messages: Message[]; hasChat: boolean }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  if (!hasChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>Selecione um ticket para ver as mensagens</p>
        </div>
      </div>
    )
  }
  
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-5xl mb-3">✉️</div>
          <p>Sem mensagens ainda</p>
          <p className="text-xs mt-1">Seja o primeiro a enviar uma mensagem</p>
        </div>
      </div>
    )
  }
  
  return (
    <ScrollArea className="flex-1 bg-[oklch(0.985_0_0)] dark:bg-[oklch(0.141_0.005_285.823)] p-4">
      <div className="space-y-2">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </ScrollArea>
  )
}

function MessageInput({ onSendMessage, disabled = false }: {
  onSendMessage: (message: string) => void
  disabled?: boolean
}) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-background">
      <div className="flex items-end gap-2">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <textarea
          ref={textareaRef}
          placeholder="Digite uma mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[40px] max-h-32"
          rows={1}
        />
        
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10"
          disabled={disabled || !message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}

function Sidebar({ 
  tickets, 
  queues, 
  selectedTicketId, 
  selectedQueue, 
  onSelectTicket, 
  onSelectQueue,
  onNewTicket
}: {
  tickets: Ticket[]
  queues: Queue[]
  selectedTicketId: string | null
  selectedQueue: Queue | null
  onSelectTicket: (id: string) => void
  onSelectQueue: (queue: Queue | null) => void
  onNewTicket: () => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [mainTab, setMainTab] = useState<'open' | 'closed' | 'search'>('open')
  const [subTab, setSubTab] = useState<'waiting' | 'attending'>('waiting')
  
  // Helper functions for empty state messages
  const getEmptyStateText = () => {
    if (mainTab === 'open') {
      return subTab === 'waiting' ? 'aguardando atendimento' : 'em atendimento'
    } else if (mainTab === 'closed') {
      return 'resolvido'
    }
    return 'encontrado'
  }

  const getEmptyStateHint = () => {
    if (mainTab === 'open') {
      return subTab === 'waiting' ? 'Todos os tickets já foram atendidos' : 'Nenhum ticket em andamento'
    } else if (mainTab === 'closed') {
      return 'Nenhum ticket resolvido ainda'
    }
    return 'Tente ajustar os filtros ou a busca'
  }
  
  // Filter tickets based on main tab and sub tab
  const filteredTickets = tickets.filter(t => {
    // 1. Queue filter
    if (selectedQueue && t.queue.id !== selectedQueue.id) return false
    
    // 2. Search filter
    if (searchQuery && !t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) && !t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) return false
    
    // 3. Main tab filter
    if (mainTab === 'open') {
      // Within "Abertas", filter by sub tab
      if (subTab === 'waiting') {
        return t.status === 'open' && !t.assignedTo
      } else if (subTab === 'attending') {
        return t.status === 'pending' && t.assignedTo
      }
    } else if (mainTab === 'closed') {
      return t.status === 'closed'
    } else if (mainTab === 'search') {
      return true // Show all for search tab
    }
    return true
  }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  
  return (
    <div className="w-[350px] border-r border-border flex flex-col bg-background shrink-0">
{/* Search and Filters - Layout compacto */}
       <div className="p-4 pb-3 bg-muted/5">
         <div className="space-y-3">
           {/* Botão Novo + Busca lado a lado */}
           <div className="flex items-center gap-2">
             <Button onClick={onNewTicket} size="sm" className="h-9 px-3 font-semibold shadow-md flex-shrink-0">
               <Plus className="h-4 w-4 mr-1.5" />
               Novo
             </Button>
             <div className="relative flex-1 min-w-0">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                 type="text"
                 placeholder="Buscar tickets..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 h-9 text-sm bg-background shadow-sm border-muted-foreground/20"
               />
             </div>
           </div>

           {/* Queue Select compacto */}
           <QueueSelect
             queues={queues}
             selectedQueue={selectedQueue}
             onSelect={onSelectQueue}
             size="sm"
             className="w-full bg-background text-xs"
           />
         </div>
       </div>

{/* Main Tabs (Abertas, Resolvidas, Busca) */}
       <div className="space-y-0">
         <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full">
           <TabsList className="grid grid-cols-3 w-full h-12 rounded-none border-b bg-muted/30">
             {[
               { id: 'open', label: 'Abertas', count: tickets.filter(t => t.status === 'open' || t.status === 'pending').length },
               { id: 'closed', label: 'Resolvidas', count: tickets.filter(t => t.status === 'closed').length },
               { id: 'search', label: 'Busca', count: tickets.length }
             ].map(tab => (
               <TabsTrigger 
                 key={tab.id}
                 value={tab.id} 
                 className="text-sm font-bold uppercase data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
               >
                 <span>{tab.label}</span>
                 {tab.count > 0 && (
                   <span className="ml-1.5 text-xs font-bold bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-full">
                     {tab.count}
                   </span>
                 )}
               </TabsTrigger>
             ))}
           </TabsList>
         </Tabs>

         {/* Sub Tabs for "Abertas" */}
         {mainTab === 'open' && (
           <Tabs value={subTab} onValueChange={(v) => setSubTab(v as any)} className="w-full">
             <TabsList className="grid grid-cols-2 w-full h-10 rounded-none border-b bg-background">
               {[
                 { id: 'waiting', label: 'Aguardando', count: tickets.filter(t => t.status === 'open' && !t.assignedTo).length },
                 { id: 'attending', label: 'Atendendo', count: tickets.filter(t => t.status === 'pending' && t.assignedTo).length }
               ].map(tab => (
                 <TabsTrigger 
                   key={tab.id}
                   value={tab.id} 
                   className="text-xs font-semibold data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none"
                 >
                   <span>{tab.label}</span>
                   {tab.count > 0 && (
                     <span className="ml-1.5 text-xs bg-secondary/30 text-secondary-foreground px-1.5 py-0.5 rounded-full">
                       {tab.count}
                     </span>
                   )}
                 </TabsTrigger>
               ))}
             </TabsList>
           </Tabs>
         )}
       </div>
      
{/* Empty State */}
       <div className="flex-1 overflow-hidden">
         <ScrollArea className="h-full">
           {filteredTickets.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 p-8 text-center text-muted-foreground opacity-60">
               <div className="text-5xl mb-4">📬</div>
               <p className="text-sm font-semibold">Nenhum ticket {getEmptyStateText()}</p>
               <p className="text-xs mt-1">{getEmptyStateHint()}</p>
             </div>
           ) : (
             <div className="divide-y divide-muted/40">
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
    </div>
  )
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function Page() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  
  const { publish, state } = useNats()
  
  const selectedTicket = selectedTicketId
    ? tickets.find(t => t.id === selectedTicketId) || null
    : null
  
  // Load mock messages when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Olá! Como posso ajudar?',
          timestamp: new Date(Date.now() - 3600000),
          sender: 'them'
        },
        {
          id: '2',
          content: 'Preciso de ajuda com a integração',
          timestamp: new Date(Date.now() - 1800000),
          sender: 'me',
          status: 'read'
        },
        {
          id: '3',
          content: 'Claro! Qual é o problema específico?',
          timestamp: new Date(Date.now() - 900000),
          sender: 'them'
        }
      ]
      setMessages(mockMessages)
    } else {
      setMessages([])
    }
  }, [selectedTicketId])
  
  // Initialize first queue
  useEffect(() => {
    if (!selectedQueue && mockQueues.length > 0) {
      setSelectedQueue(mockQueues[0])
    }
  }, [])
  
  const handleNewTicket = () => {
    if (!state.connected) {
      alert('Não conectado ao servidor NATS')
      return
    }
    
    const newTicketId = `ticket-${Date.now()}`
    const queue = mockQueues[0]
    const newTicket: Ticket = {
      id: newTicketId,
      contactName: `Novo Contato ${newTicketId.slice(-4)}`,
      contactNumber: `55119${Math.random().toString().slice(2, 11)}`,
      lastMessage: 'Novo ticket criado',
      status: 'open',
      queue,
      assignedTo: null,
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setTickets(prev => [newTicket, ...prev])
    
    publish('ticket.created', {
      ticketId: newTicketId,
      queue: queue.id,
      timestamp: new Date()
    }).catch(console.error)
    
    setSelectedTicketId(newTicketId)
    
    if (!selectedQueue) {
      setSelectedQueue(queue)
    }
  }
  
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, unreadCount: 0 } : t
    ))
  }
  
  const handleSelectQueue = (queue: Queue | null) => {
    setSelectedQueue(queue)
    if (!queue) {
      setSelectedTicketId(null)
    }
  }
  
  const handleAcceptTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'pending' as const,
          assignedTo: currentUser,
          updatedAt: new Date()
        }
      }
      return t
    }))
    
    publish('ticket.updated', {
      ticketId,
      action: 'accept',
      userId: currentUser.id,
      timestamp: new Date()
    }).catch(console.error)
  }
  
  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'closed' as const,
          closedAt: new Date(),
          updatedAt: new Date()
        }
      }
      return t
    }))
    
    publish('ticket.updated', {
      ticketId,
      action: 'resolve',
      userId: currentUser.id,
      timestamp: new Date()
    }).catch(console.error)
  }
  
  const handleReopenTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'open' as const,
          closedAt: undefined,
          updatedAt: new Date()
        }
      }
      return t
    }))
    
    publish('ticket.updated', {
      ticketId,
      action: 'reopen',
      userId: currentUser.id,
      timestamp: new Date()
    }).catch(console.error)
  }
  
  const handleAssignTicket = (ticketId: string, userId: string) => {
    const user = mockUsers.find(u => u.id === userId)
    if (!user) return
    
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          assignedTo: user,
          updatedAt: new Date()
        }
      }
      return t
    }))
    
    publish('ticket.updated', {
      ticketId,
      action: 'assign',
      userId,
      timestamp: new Date()
    }).catch(console.error)
  }
  
  const handleSendMessage = async (content: string) => {
    if (!selectedTicket || !state.connected) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: 'me',
      status: 'sent'
    }
    
    setMessages(prev => [...prev, newMessage])
    
    try {
      await publish(`chat.${selectedTicket.id}.send`, {
        content,
        timestamp: newMessage.timestamp.toISOString(),
        sender: 'me'
      })
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tickets", href: "/dashboard/chats" },
          { label: selectedQueue?.name || "Selecione uma fila" },
        ]}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          tickets={tickets}
          queues={mockQueues}
          selectedTicketId={selectedTicketId}
          selectedQueue={selectedQueue}
          onSelectTicket={handleSelectTicket}
          onSelectQueue={handleSelectQueue}
          onNewTicket={handleNewTicket}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {selectedTicket ? (
            <>
              <ChatHeader
                ticket={selectedTicket}
                onBack={() => setSelectedTicketId(null)}
                onAccept={handleAcceptTicket}
                onResolve={handleResolveTicket}
                onReopen={handleReopenTicket}
                onAssign={handleAssignTicket}
              />
              
              <MessageList messages={messages} hasChat={!!selectedTicket} />
              
              <MessageInput 
                onSendMessage={handleSendMessage} 
                disabled={!state.connected}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">Bem-vindo ao Sistema de Tickets</h3>
                <p className="text-sm">Selecione um ticket da lista ou crie um novo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
