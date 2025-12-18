"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNats } from "@/lib/nats/nats-context"
import { useNatsSubscription } from "@/lib/nats/nats-hooks"

interface ChatItem {
  id: string
  title: string
  description: string
  lastMessage: string
  timestamp?: Date
  unread?: boolean
}

const initialChats: ChatItem[] = [
  {
    id: "1",
    title: "Support Chat",
    description: "Last message: 2 minutes ago",
    lastMessage: "Customer inquiry about pricing...",
    unread: true,
  },
  {
    id: "2",
    title: "Sales Inquiry",
    description: "Last message: 15 minutes ago",
    lastMessage: "Interested in enterprise plan...",
    unread: false,
  },
  {
    id: "3",
    title: "Technical Support",
    description: "Last message: 1 hour ago",
    lastMessage: "API integration question...",
    unread: true,
  },
  {
    id: "4",
    title: "General Inquiry",
    description: "Last message: 3 hours ago",
    lastMessage: "Product features question...",
    unread: false,
  },
  {
    id: "5",
    title: "Billing Question",
    description: "Last message: 5 hours ago",
    lastMessage: "Invoice clarification needed...",
    unread: false,
  },
  {
    id: "6",
    title: "Feedback",
    description: "Last message: 1 day ago",
    lastMessage: "Positive feedback on new features...",
    unread: false,
  },
]

export function ChatList() {
  const [chats, setChats] = useState<ChatItem[]>(initialChats)
  const { publish, state } = useNats()

  // Assinar atualizações de chat via NATS
  useNatsSubscription('chat.updates', (message) => {
    setChats(prevChats => {
      const chatData = message.data
      
      // Verificar se é uma nova mensagem ou atualização
      if (chatData.type === 'new_message') {
        return prevChats.map(chat => {
          if (chat.id === chatData.chatId) {
            return {
              ...chat,
              lastMessage: chatData.message,
              description: `Last message: just now`,
              unread: true,
              timestamp: new Date()
            }
          }
          return chat
        })
      } else if (chatData.type === 'new_chat') {
        // Adicionar novo chat
        const newChat: ChatItem = {
          id: chatData.chatId,
          title: chatData.title || 'New Chat',
          description: 'New chat started',
          lastMessage: chatData.message || 'No messages yet',
          unread: true,
          timestamp: new Date()
        }
        return [newChat, ...prevChats]
      }
      
      return prevChats
    })
  })

  // Carregar dados iniciais quando conectado
  useEffect(() => {
    if (state.connected) {
      // Solicitar dados iniciais
      publish('chat.request', { type: 'initial_load' }).catch(console.error)
    }
  }, [state.connected, publish])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {chats.map((chat) => (
        <Card key={chat.id} className={chat.unread ? 'border-l-4 border-primary' : ''}>
          <CardHeader>
            <CardTitle>{chat.title}</CardTitle>
            <CardDescription>{chat.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
            {chat.unread && (
              <div className="mt-2 flex justify-end">
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  New
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChatHeader() {
  const { publish, state } = useNats()
  const [isCreating, setIsCreating] = useState(false)

  const handleNewChat = async () => {
    if (!state.connected) {
      alert('Not connected to NATS server')
      return
    }

    setIsCreating(true)
    try {
      // Criar um novo chat
      const newChatId = Date.now().toString()
      await publish('chat.create', {
        chatId: newChatId,
        title: `New Chat ${newChatId.slice(-4)}`,
        message: 'Welcome to your new chat!'
      })
    } catch (error) {
      console.error('Error creating chat:', error)
      alert('Failed to create chat')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Chats</h2>
      <Button onClick={handleNewChat} disabled={isCreating || !state.connected}>
        {isCreating ? 'Creating...' : 'New Chat'}
      </Button>
    </div>
  )
}
