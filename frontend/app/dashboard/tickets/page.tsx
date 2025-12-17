'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Filter, Plus, MessageSquare, User, Clock, CheckCircle, Send, Paperclip, Smile, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [queueFilter, setQueueFilter] = useState('all')

  // Mock data - replace with actual API calls
  // State for selected ticket chat
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [message, setMessage] = useState('')

  const tickets = [
    {
      id: '1',
      contactName: 'John Doe',
      contactPhone: '5511999999999',
      queue: 'Support',
      status: 'open',
      lastMessage: 'I need help with my order',
      lastMessageTime: '2024-01-15T14:30:00Z',
      unread: true,
      assignedTo: 'Agent Smith',
      messages: [
        {
          id: '1',
          text: 'Hello, I need help with my order #12345',
          sender: 'customer',
          timestamp: '2024-01-15T14:30:00Z',
          read: true
        },
        {
          id: '2',
          text: 'Hi John, I can help with that. What seems to be the problem?',
          sender: 'agent',
          timestamp: '2024-01-15T14:32:00Z',
          read: true
        },
        {
          id: '3',
          text: 'The delivery date was supposed to be yesterday but I still haven\'t received it',
          sender: 'customer',
          timestamp: '2024-01-15T14:33:00Z',
          read: true
        },
        {
          id: '4',
          text: 'I apologize for the inconvenience. Let me check the tracking information for you.',
          sender: 'agent',
          timestamp: '2024-01-15T14:35:00Z',
          read: true
        }
      ],
      contactAvatar: 'https://github.com/shadcn.png'
    },
    {
      id: '2',
      contactName: 'Jane Smith',
      contactPhone: '5511888888888',
      queue: 'Sales',
      status: 'pending',
      lastMessage: 'Can I get a quote?',
      lastMessageTime: '2024-01-15T10:15:00Z',
      unread: false,
      assignedTo: null,
      messages: [
        {
          id: '1',
          text: 'Hi, I\'m interested in your product',
          sender: 'customer',
          timestamp: '2024-01-15T10:15:00Z',
          read: true
        }
      ],
      contactAvatar: 'https://github.com/vercel.png'
    },
    {
      id: '3',
      contactName: 'Bob Johnson',
      contactPhone: '5511777777777',
      queue: 'Support',
      status: 'closed',
      lastMessage: 'Thank you for your help!',
      lastMessageTime: '2024-01-14T16:45:00Z',
      unread: false,
      assignedTo: 'Agent Smith',
      messages: [
        {
          id: '1',
          text: 'My issue has been resolved',
          sender: 'customer',
          timestamp: '2024-01-14T16:45:00Z',
          read: true
        },
        {
          id: '2',
          text: 'You\'re welcome! Let us know if you need anything else.',
          sender: 'agent',
          timestamp: '2024-01-14T16:46:00Z',
          read: true
        }
      ],
      contactAvatar: 'https://github.com/radix-ui.png'
    }
  ]

  const queues = [
    { id: 'all', name: 'All Queues' },
    { id: 'support', name: 'Support' },
    { id: 'sales', name: 'Sales' },
    { id: 'billing', name: 'Billing' }
  ]

  const filteredTickets = tickets.filter(ticket => {
    // Filter by search term
    const matchesSearch = 
      ticket.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.contactPhone.includes(searchTerm) ||
      ticket.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by status
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter

    // Filter by queue
    const matchesQueue = queueFilter === 'all' || ticket.queue.toLowerCase() === queueFilter

    return matchesSearch && matchesStatus && matchesQueue
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'closed':
        return <Badge variant="success">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <Button asChild>
          <Link href="/dashboard/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickets..." 
            className="pl-10" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={queueFilter} onValueChange={setQueueFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Queue" />
            </SelectTrigger>
            <SelectContent>
              {queues.map(queue => (
                <SelectItem key={queue.id} value={queue.id}>{queue.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket list */}
        <div className={`lg:col-span-1 ${selectedTicket ? 'hidden lg:block' : ''}`}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {filteredTickets.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                    <p>No tickets found</p>
                  </div>
                ) : (
                  filteredTickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedTicket?.id === ticket.id ? 'bg-muted' : ''} ${ticket.unread ? 'border-l-2 border-primary' : ''}`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={ticket.contactAvatar} alt={ticket.contactName} />
                          <AvatarFallback>{ticket.contactName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium truncate">{ticket.contactName}</h3>
                            <span className="text-xs text-muted-foreground ml-2">
                              {new Date(ticket.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">{ticket.queue}</Badge>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {ticket.lastMessage}
                          </p>
                          {ticket.unread && (
                            <div className="flex justify-end mt-1">
                              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat area */}
        {selectedTicket ? (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="lg:hidden" 
                      onClick={() => setSelectedTicket(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar>
                      <AvatarImage src={selectedTicket.contactAvatar} alt={selectedTicket.contactName} />
                      <AvatarFallback>{selectedTicket.contactName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{selectedTicket.contactName}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">{selectedTicket.queue}</Badge>
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="space-y-4 py-4">
                  {selectedTicket.messages.map((msg: any) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] rounded-lg p-3 ${msg.sender === 'agent' 
                          ? 'bg-primary text-primary-foreground rounded-br-none' 
                          : 'bg-muted rounded-bl-none'}`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender === 'customer' && msg.read && ' ✓✓'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (message.trim()) {
                    // Send message logic here
                    console.log('Sending message:', message)
                    setMessage('')
                  }
                }} className="flex w-full items-center space-x-2">
                  <Button variant="outline" size="icon" type="button">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" type="button">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>

            {/* Ticket details sidebar */}
            <div className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ticket Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Queue</span>
                    <span className="font-medium">{selectedTicket.queue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Assigned to</span>
                    <span className="font-medium">{selectedTicket.assignedTo || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-medium text-sm">{new Date(selectedTicket.lastMessageTime).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedTicket.contactName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedTicket.contactPhone}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p>Select a ticket to view the conversation</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
