"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Plus, Search, CheckCircle2, Send, Phone, Video, MoreVertical, ChevronLeft, Users } from "lucide-react"
import { useNats } from "@/lib/nats/nats-context"
import { Ticket, Queue, User, Message, Tag, QuickReply } from "@/lib/nats/nats-types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { QueueSelect } from "@/components/chats/queue-select"
import { TicketItem } from "@/components/chats/ticket-item"
import { ConnectionStatus } from "@/components/chats/connection-status"
import { QRCodeModal } from "@/components/chats/qrcode-modal"
import { TransferMenu } from "@/components/chats/transfer-menu"
import { ReadReceipt } from "@/components/chats/read-receipt"
import { MediaPreview } from "@/components/chats/media-preview"
import { EmojiPicker } from "@/components/chats/emoji-picker"
import { AttachmentButton } from "@/components/chats/attachment-button"
import { AudioRecorder } from "@/components/chats/audio-recorder"
import { QuickReplies } from "@/components/chats/quick-replies"

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

const mockTags: Tag[] = [
  { id: "t1", name: "Urgente", colorClass: "bg-chart-1" },
  { id: "t2", name: "VIP", colorClass: "bg-chart-4" },
  { id: "t3", name: "Novo", colorClass: "bg-chart-2" }
]

const mockTickets: (Ticket & { tags?: Tag[]; isGroup?: boolean })[] = [
  {
    id: "ticket-1", contactName: "João Silva", contactNumber: "5511999999999",
    lastMessage: "Problema com integração da API", status: "open", queue: mockQueues[0],
    assignedTo: null, unreadCount: 3, createdAt: new Date(Date.now() - 3600000), 
    updatedAt: new Date(Date.now() - 1800000), tags: [mockTags[0]]
  },
  {
    id: "ticket-2", contactName: "Maria Santos", contactNumber: "5511988888888",
    lastMessage: "Quero contratar plano enterprise", status: "pending", queue: mockQueues[1],
    assignedTo: currentUser, unreadCount: 1, createdAt: new Date(Date.now() - 7200000), 
    updatedAt: new Date(Date.now() - 3600000), tags: [mockTags[1], mockTags[2]]
  },
  {
    id: "ticket-3", contactName: "Pedro Costa", contactNumber: "5511977777777",
    lastMessage: "Dúvida sobre fatura do mês", status: "pending", queue: mockQueues[2],
    assignedTo: { id: "2", name: "Ana Rodrigues", email: "ana@onwapp.com" }, unreadCount: 5,
    createdAt: new Date(Date.now() - 86400000), updatedAt: new Date(Date.now() - 7200000)
  },
  {
    id: "ticket-4", contactName: "Grupo Marketing", contactNumber: "5511966666666",
    lastMessage: "Erro ao fazer login no sistema", status: "open", queue: mockQueues[0],
    assignedTo: null, unreadCount: 0, createdAt: new Date(Date.now() - 1800000), 
    updatedAt: new Date(Date.now() - 600000), isGroup: true
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
    assignedTo: currentUser, unreadCount: 0, createdAt: new Date(Date.now() - 5400000), 
    updatedAt: new Date(Date.now() - 2400000)
  }
]

const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@onwapp.com" },
  { id: "2", name: "Ana Rodrigues", email: "ana@onwapp.com" },
  { id: "3", name: "João Silva", email: "joao@onwapp.com" }
]

const mockQuickReplies: QuickReply[] = [
  { id: "qr1", shortcut: "ola", message: "Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?" },
  { id: "qr2", shortcut: "aguarde", message: "Por favor, aguarde um momento enquanto verifico essa informação." },
  { id: "qr3", shortcut: "obrigado", message: "Obrigado por entrar em contato conosco! Tenha um ótimo dia!" }
]

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ message }: { message: Message }) {
  const isMyMessage = message.sender === 'me'
  
  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${
        isMyMessage 
          ? 'bg-primary text-primary-foreground rounded-br-sm' 
          : 'bg-card text-card-foreground border border-border rounded-bl-sm'
      }`}>
        {message.media && (
          <div className="mb-2">
            <MediaPreview media={message.media} />
          </div>
        )}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <div className={`flex items-center justify-end gap-1 mt-1 ${
          isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
        }`}>
          <span className="text-[10px]">{formatTime(message.timestamp)}</span>
          {isMyMessage && message.status && (
            <ReadReceipt status={message.status} className="ml-0.5" />
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
      <div className="flex-1 flex items-center justify-center bg-secondary/20">
        <div className="text-center text-muted-foreground">
          <p>Selecione um ticket para ver as mensagens</p>
        </div>
      </div>
    )
  }
  
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/20">
        <div className="text-center text-muted-foreground">
          <div className="text-5xl mb-3">✉️</div>
          <p>Sem mensagens ainda</p>
          <p className="text-xs mt-1">Seja o primeiro a enviar uma mensagem</p>
        </div>
      </div>
    )
  }
  
  return (
    <ScrollArea className="flex-1 bg-secondary/20">
      <div className="p-4 space-y-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </ScrollArea>
  )
}

function MessageInput({ 
  onSendMessage, 
  onSendAudio,
  onSendFile,
  quickReplies,
  disabled = false 
}: {
  onSendMessage: (message: string) => void
  onSendAudio?: (blob: Blob, duration: number) => void
  onSendFile?: (file: File, type: 'image' | 'document') => void
  quickReplies?: QuickReply[]
  disabled?: boolean
}) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }
  
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim() && !disabled) {
        onSendMessage(message.trim())
        setMessage("")
      }
    }
  }

  function handleEmojiSelect(emoji: string) {
    setMessage(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  function handleQuickReplySelect(replyMessage: string) {
    setMessage(replyMessage)
    textareaRef.current?.focus()
  }

  function handleAudioSend(blob: Blob, duration: number) {
    if (onSendAudio) {
      onSendAudio(blob, duration)
    }
  }

  function handleFileSelect(file: File, type: 'image' | 'document') {
    if (onSendFile) {
      onSendFile(file, type)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-background">
      <div className="flex items-end gap-2">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
        <AttachmentButton onFileSelect={handleFileSelect} disabled={disabled} />
        
        <QuickReplies 
          replies={quickReplies || []} 
          inputValue={message}
          onSelect={handleQuickReplySelect}
        >
          <textarea
            ref={textareaRef}
            placeholder="Digite uma mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[40px] max-h-32"
            rows={1}
          />
        </QuickReplies>
        
        {message.trim() ? (
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={disabled}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <AudioRecorder onSend={handleAudioSend} disabled={disabled} />
        )}
      </div>
    </form>
  )
}

function ChatHeader({ 
  ticket, 
  queues,
  users,
  onBack, 
  onAccept, 
  onResolve, 
  onReopen, 
  onTransferToQueue,
  onTransferToUser
}: {
  ticket: Ticket & { isGroup?: boolean }
  queues: Queue[]
  users: User[]
  onBack: () => void
  onAccept: (ticketId: string) => void
  onResolve: (ticketId: string) => void
  onReopen: (ticketId: string) => void
  onTransferToQueue: (ticketId: string, queueId: string) => void
  onTransferToUser: (ticketId: string, userId: string) => void
}) {
  const canAccept = ticket.status === 'open' && (!ticket.assignedTo || ticket.assignedTo.id !== currentUser.id)
  const canResolve = (ticket.status === 'pending' || ticket.status === 'open') && ticket.assignedTo?.id === currentUser.id
  const canReopen = ticket.status === 'closed'
  
  return (
    <div className="h-16 border-b border-border bg-background flex items-center px-4 gap-4">
      <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden shrink-0" onClick={onBack}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <div className="relative shrink-0">
        <Avatar 
          className="h-10 w-10 border-2"
          style={{ borderColor: ticket.queue.color }}
        >
          <AvatarImage 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.contactName)}&background=${ticket.queue.color.replace('#', '')}&color=fff`} 
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {getInitials(ticket.contactName)}
          </AvatarFallback>
        </Avatar>
        {ticket.isGroup && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
            <Users className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-foreground font-semibold text-sm truncate">{ticket.contactName}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{ticket.contactNumber}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>{ticket.queue.icon}</span>
            <span>{ticket.queue.name}</span>
          </span>
          {ticket.assignedTo && (
            <>
              <span>•</span>
              <span>{ticket.assignedTo.name}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        {canAccept && (
          <Button size="sm" onClick={() => onAccept(ticket.id)} className="hidden sm:flex h-8 px-3 text-xs">
            Aceitar
          </Button>
        )}
        {canResolve && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onResolve(ticket.id)} 
            className="hidden sm:flex h-8 px-3 text-xs border-chart-2/50 text-chart-2 hover:bg-chart-2/10"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Resolver
          </Button>
        )}
        {canReopen && (
          <Button size="sm" variant="outline" onClick={() => onReopen(ticket.id)} className="hidden sm:flex h-8 px-3 text-xs">
            Reabrir
          </Button>
        )}
        
        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
        
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Phone className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Video className="h-4 w-4 text-muted-foreground" />
        </Button>
        
        <TransferMenu
          queues={queues}
          users={users}
          currentQueueId={ticket.queue.id}
          currentUserId={ticket.assignedTo?.id}
          onTransferToQueue={(queueId) => onTransferToQueue(ticket.id, queueId)}
          onTransferToUser={(userId) => onTransferToUser(ticket.id, userId)}
        />
        
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}

function Sidebar({ 
  tickets, 
  queues, 
  selectedTicketId, 
  selectedQueue, 
  connectionStatus,
  onSelectTicket, 
  onSelectQueue,
  onNewTicket,
  onReconnect
}: {
  tickets: (Ticket & { tags?: Tag[]; isGroup?: boolean })[]
  queues: Queue[]
  selectedTicketId: string | null
  selectedQueue: Queue | null
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
  onSelectTicket: (id: string) => void
  onSelectQueue: (queue: Queue | null) => void
  onNewTicket: () => void
  onReconnect: () => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [mainTab, setMainTab] = useState<'waiting' | 'attending' | 'groups' | 'search'>('waiting')
  
  function getEmptyMessage(): { title: string; hint: string } {
    const messages = {
      waiting: { title: 'Nenhum ticket aguardando', hint: 'Todos os tickets já foram atendidos' },
      attending: { title: 'Nenhum ticket em atendimento', hint: 'Aceite um ticket para começar' },
      groups: { title: 'Nenhum grupo encontrado', hint: 'Grupos aparecerão aqui' },
      search: { title: 'Nenhum resultado', hint: 'Tente ajustar a busca' }
    }
    return messages[mainTab]
  }

  const filteredTickets = tickets.filter(t => {
    if (selectedQueue && selectedQueue.id !== 'all' && t.queue.id !== selectedQueue.id) return false
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!t.contactName.toLowerCase().includes(query) && !t.lastMessage.toLowerCase().includes(query)) {
        return false
      }
    }
    
    switch (mainTab) {
      case 'waiting':
        return t.status === 'open' && !t.assignedTo
      case 'attending':
        return t.status === 'pending' && t.assignedTo?.id === currentUser.id
      case 'groups':
        return t.isGroup === true
      case 'search':
        return true
      default:
        return true
    }
  }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  const tabCounts = {
    waiting: tickets.filter(t => t.status === 'open' && !t.assignedTo).length,
    attending: tickets.filter(t => t.status === 'pending' && t.assignedTo?.id === currentUser.id).length,
    groups: tickets.filter(t => t.isGroup === true).length,
    search: tickets.length
  }
  
  return (
    <div className="w-[340px] border-r border-border flex flex-col bg-background shrink-0">
      <ConnectionStatus 
        status={connectionStatus}
        phoneNumber="+55 11 99999-9999"
        onReconnect={onReconnect}
      />

      <div className="p-3 space-y-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button onClick={onNewTicket} size="sm" className="h-9 px-3 shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Novo
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value) setMainTab('search')
              }}
              className="pl-9 h-9 text-sm bg-background"
            />
          </div>
        </div>

        <QueueSelect
          queues={queues}
          selectedQueue={selectedQueue}
          onSelect={onSelectQueue}
          size="sm"
          className="w-full"
        />
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-11 rounded-none border-b border-border bg-muted/30">
          {[
            { id: 'waiting', label: 'Aguardando' },
            { id: 'attending', label: 'Atendendo' },
            { id: 'groups', label: 'Grupos' },
            { id: 'search', label: 'Todos' }
          ].map(tab => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1"
            >
              <span className="truncate">{tab.label}</span>
              {tabCounts[tab.id as keyof typeof tabCounts] > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 h-4 min-w-[18px]">
                  {tabCounts[tab.id as keyof typeof tabCounts]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <ScrollArea className="flex-1">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">📭</div>
            <p className="text-sm font-medium text-muted-foreground">{getEmptyMessage().title}</p>
            <p className="text-xs text-muted-foreground mt-1">{getEmptyMessage().hint}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
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

export default function Page() {
  const [tickets, setTickets] = useState(mockTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(mockQueues[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [qrModalOpen, setQrModalOpen] = useState(false)
  
  const { publish, state } = useNats()
  
  const selectedTicket = selectedTicketId
    ? tickets.find(t => t.id === selectedTicketId) || null
    : null

  const connectionStatus = useMemo((): 'connected' | 'connecting' | 'disconnected' => {
    if (state.connected) return 'connected'
    if (state.connecting) return 'connecting'
    return 'disconnected'
  }, [state.connected, state.connecting])
  
  const ticketMessages = useMemo((): Message[] => {
    if (!selectedTicket) return []
    return [
      {
        id: '1',
        content: 'Olá! Como posso ajudar?',
        timestamp: new Date(Date.now() - 3600000),
        sender: 'them' as const
      },
      {
        id: '2',
        content: 'Preciso de ajuda com a integração',
        timestamp: new Date(Date.now() - 1800000),
        sender: 'me' as const,
        status: 'read' as const
      },
      {
        id: '3',
        content: 'Claro! Qual é o problema específico?',
        timestamp: new Date(Date.now() - 900000),
        sender: 'them' as const
      }
    ]
  }, [selectedTicket])

  useEffect(() => {
    setMessages(ticketMessages)
  }, [ticketMessages])
  
  function handleNewTicket() {
    if (!state.connected) return
    
    const newTicketId = `ticket-${Date.now()}`
    const queue = mockQueues[0]
    const newTicket: Ticket & { tags?: Tag[]; isGroup?: boolean } = {
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
    setSelectedTicketId(newTicketId)
    
    publish('ticket.created', {
      ticketId: newTicketId,
      queue: queue.id,
      timestamp: new Date()
    }).catch(console.error)
  }
  
  function handleSelectTicket(ticketId: string) {
    setSelectedTicketId(ticketId)
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, unreadCount: 0 } : t
    ))
  }
  
  function handleSelectQueue(queue: Queue | null) {
    setSelectedQueue(queue)
  }
  
  function handleAcceptTicket(ticketId: string) {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'pending' as const, assignedTo: currentUser, updatedAt: new Date() }
      }
      return t
    }))
    
    publish('ticket.updated', { ticketId, action: 'accept', userId: currentUser.id, timestamp: new Date() }).catch(console.error)
  }
  
  function handleResolveTicket(ticketId: string) {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'closed' as const, closedAt: new Date(), updatedAt: new Date() }
      }
      return t
    }))
    
    publish('ticket.updated', { ticketId, action: 'resolve', userId: currentUser.id, timestamp: new Date() }).catch(console.error)
  }
  
  function handleReopenTicket(ticketId: string) {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'open' as const, closedAt: undefined, updatedAt: new Date() }
      }
      return t
    }))
    
    publish('ticket.updated', { ticketId, action: 'reopen', userId: currentUser.id, timestamp: new Date() }).catch(console.error)
  }
  
  function handleTransferToQueue(ticketId: string, queueId: string) {
    const queue = mockQueues.find(q => q.id === queueId)
    if (!queue) return
    
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, queue, updatedAt: new Date() }
      }
      return t
    }))
    
    publish('ticket.updated', { ticketId, action: 'transfer_queue', queueId, timestamp: new Date() }).catch(console.error)
  }
  
  function handleTransferToUser(ticketId: string, userId: string) {
    const user = mockUsers.find(u => u.id === userId)
    if (!user) return
    
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, assignedTo: user, updatedAt: new Date() }
      }
      return t
    }))
    
    publish('ticket.updated', { ticketId, action: 'transfer_user', userId, timestamp: new Date() }).catch(console.error)
  }
  
  async function handleSendMessage(content: string) {
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
          msg.id === newMessage.id ? { ...msg, status: 'delivered' as const } : msg
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  function handleReconnect() {
    setQrModalOpen(true)
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
          connectionStatus={connectionStatus}
          onSelectTicket={handleSelectTicket}
          onSelectQueue={handleSelectQueue}
          onNewTicket={handleNewTicket}
          onReconnect={handleReconnect}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {selectedTicket ? (
            <>
              <ChatHeader
                ticket={selectedTicket}
                queues={mockQueues}
                users={mockUsers}
                onBack={() => setSelectedTicketId(null)}
                onAccept={handleAcceptTicket}
                onResolve={handleResolveTicket}
                onReopen={handleReopenTicket}
                onTransferToQueue={handleTransferToQueue}
                onTransferToUser={handleTransferToUser}
              />
              
              <MessageList messages={messages} hasChat={!!selectedTicket} />
              
              <MessageInput 
                onSendMessage={handleSendMessage}
                quickReplies={mockQuickReplies}
                disabled={!state.connected}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-secondary/10">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Bem-vindo ao Sistema de Tickets</h3>
                <p className="text-sm">Selecione um ticket da lista ou crie um novo</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <QRCodeModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        onRefresh={() => console.log('Refresh QR Code')}
      />
    </div>
  )
}
