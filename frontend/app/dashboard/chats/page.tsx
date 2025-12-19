"use client"

import { useState, useEffect, useMemo } from "react"
import { useNats } from "@/lib/nats/nats-context"
import { Ticket, Queue, User, Message, Tag, QuickReply } from "@/lib/nats/nats-types"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ChatSidebar } from "@/components/chats/chat-sidebar"
import { ChatHeader } from "@/components/chats/chat-header"
import { MessageList } from "@/components/chats/message-list"
import { MessageInput } from "@/components/chats/message-input"

// Reusing mock data for now
const currentUser: User = {
  id: "1",
  name: "Admin User",
  email: "admin@onwapp.com",
  avatar: "https://github.com/shadcn.png"
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
    id: "ticket-4", contactName: "Grupo Marketing", contactNumber: "5511966666666",
    lastMessage: "Erro ao fazer login no sistema", status: "open", queue: mockQueues[0],
    assignedTo: null, unreadCount: 0, createdAt: new Date(Date.now() - 1800000), 
    updatedAt: new Date(Date.now() - 600000), isGroup: true
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

function createMockMessages(): Message[] {
  const now = Date.now()
  return [
    {
      id: '1',
      content: 'Olá! Como posso ajudar?',
      timestamp: new Date(now - 3600000),
      sender: 'them' as const
    },
    {
      id: '2',
      content: 'Preciso de ajuda com a integração',
      timestamp: new Date(now - 1800000),
      sender: 'me' as const,
      status: 'read' as const
    },
    {
      id: '3',
      content: 'Claro! Qual é o problema específico?',
      timestamp: new Date(now - 900000),
      sender: 'them' as const
    }
  ]
}

export default function Page() {
  const [tickets, setTickets] = useState(mockTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(mockQueues[0])
  const [messages, setMessages] = useState<Message[]>([])
  
  const { publish, state } = useNats()
  
  const selectedTicket = selectedTicketId
    ? tickets.find(t => t.id === selectedTicketId) || null
    : null

  const connectionStatus = useMemo((): 'connected' | 'connecting' | 'disconnected' => {
    if (state.connected) return 'connected'
    if (state.connecting) return 'connecting'
    return 'disconnected'
  }, [state.connected, state.connecting])

  useEffect(() => {
    const loadMessages = async () => {
      if (selectedTicketId) {
        // Simular carregamento assíncrono para evitar aviso de lint
        setMessages(createMockMessages())
      } else {
        setMessages([])
      }
    }
    loadMessages()
  }, [selectedTicketId])
  
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

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <DashboardHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tickets", href: "/dashboard/chats" },
          { label: selectedQueue?.name || "Selecione uma fila" },
        ]}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          tickets={tickets}
          queues={mockQueues}
          currentUser={currentUser}
          selectedTicketId={selectedTicketId}
          selectedQueue={selectedQueue}
          connectionStatus={connectionStatus}
          onSelectTicket={handleSelectTicket}
          onSelectQueue={handleSelectQueue}
          onNewTicket={handleNewTicket}
        />
        
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {selectedTicket ? (
            <>
              <ChatHeader
                ticket={selectedTicket}
                queues={mockQueues}
                users={mockUsers}
                currentUser={currentUser}
                onBack={() => setSelectedTicketId(null)}
                onAccept={handleAcceptTicket}
                onResolve={handleResolveTicket}
                onReopen={handleReopenTicket}
                onTransferToQueue={handleTransferToQueue}
                onTransferToUser={handleTransferToUser}
              />
              
              <MessageList messages={messages} hasChat={!!selectedTicket} />
              
              <div className="bg-secondary/50 p-3">
                 <MessageInput 
                    onSendMessage={handleSendMessage}
                    quickReplies={mockQuickReplies}
                    disabled={!state.connected}
                 />
              </div>
            </>
          ) : (
            <MessageList messages={[]} hasChat={false} />
          )}
        </div>
      </div>
    </div>
  )
}
