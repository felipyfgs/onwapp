"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ChatItem {
  title: string
  description: string
  lastMessage: string
}

const mockChats: ChatItem[] = [
  {
    title: "Support Chat",
    description: "Last message: 2 minutes ago",
    lastMessage: "Customer inquiry about pricing...",
  },
  {
    title: "Sales Inquiry",
    description: "Last message: 15 minutes ago",
    lastMessage: "Interested in enterprise plan...",
  },
  {
    title: "Technical Support",
    description: "Last message: 1 hour ago",
    lastMessage: "API integration question...",
  },
  {
    title: "General Inquiry",
    description: "Last message: 3 hours ago",
    lastMessage: "Product features question...",
  },
  {
    title: "Billing Question",
    description: "Last message: 5 hours ago",
    lastMessage: "Invoice clarification needed...",
  },
  {
    title: "Feedback",
    description: "Last message: 1 day ago",
    lastMessage: "Positive feedback on new features...",
  },
]

export function ChatList() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {mockChats.map((chat, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{chat.title}</CardTitle>
            <CardDescription>{chat.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChatHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Chats</h2>
      <Button>New Chat</Button>
    </div>
  )
}
