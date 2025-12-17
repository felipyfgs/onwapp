'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, Paperclip, Smile, User, Phone, Mail, ArrowLeft, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
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
  ])

  const ticket = {
    id: params.id,
    contact: {
      name: 'John Doe',
      phone: '5511999999999',
      email: 'john@example.com',
      avatar: 'https://github.com/shadcn.png'
    },
    queue: 'Support',
    status: 'open',
    createdAt: '2024-01-15T14:30:00Z',
    assignedTo: 'Agent Smith',
    session: 'WhatsApp - Main Support Channel'
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'agent',
      timestamp: new Date().toISOString(),
      read: false
    }

    setMessages([...messages, newMessage])
    setMessage('')
  }

  const handleStatusChange = (value: string) => {
    // Update ticket status
    console.log('Status changed to:', value)
  }

  const handleAssign = (value: string) => {
    // Assign ticket to agent
    console.log('Assigned to:', value)
  }

  const agents = [
    { id: 'unassigned', name: 'Unassigned' },
    { id: 'agent-smith', name: 'Agent Smith' },
    { id: 'jane-doe', name: 'Jane Doe' },
    { id: 'bob-johnson', name: 'Bob Johnson' }
  ]

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Ticket #{ticket.id}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Select onValueChange={handleStatusChange} defaultValue={ticket.status}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={handleAssign} defaultValue={ticket.assignedTo || 'unassigned'}>  
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assign to" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={ticket.contact.avatar} alt={ticket.contact.name} />
                  <AvatarFallback>{ticket.contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{ticket.contact.name}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{ticket.queue}</Badge>
                    <Badge variant="destructive">Open</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4">
                {messages.map((msg) => (
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
                        {new Date(msg.timestamp).toLocaleTimeString()}
                        {msg.sender === 'customer' && msg.read && ' ✓✓'}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
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
        </div>

        {/* Contact info sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span>{ticket.contact.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{ticket.contact.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{ticket.contact.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="destructive">Open</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Queue</span>
                <span className="font-medium">{ticket.queue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Assigned to</span>
                <span className="font-medium">{ticket.assignedTo || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Session</span>
                <span className="font-medium text-sm truncate max-w-[150px]">{ticket.session}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="font-medium text-sm">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                View Contact History
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="mr-2 h-4 w-4" />
                Call Contact
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
