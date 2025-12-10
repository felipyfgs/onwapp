"use client"

import { useEffect, useState, useCallback, use } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MessageSquare } from "lucide-react"
import { ChatSidebar, ChatView } from "@/components/chats"
import { Chat, getChats } from "@/lib/api/chats"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"

interface ChatsPageProps {
  params: Promise<{ id: string }>
}

export default function ChatsPage({ params }: ChatsPageProps) {
  const { id } = use(params)

  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)

  const fetchChats = useCallback(async () => {
    try {
      const data = await getChats(id)
      setChats(data || [])
    } catch (error) {
      console.error("Failed to fetch chats:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Auto-refresh chats every 10 seconds
  useAutoRefresh({
    enabled: !loading,
    interval: 10000,
    onRefresh: fetchChats,
  })

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,0px))]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Conversas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content - Fixed height container */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1 min-h-0">
          {/* Chat List - Independent scroll */}
          <div className="w-[360px] lg:w-[400px] shrink-0 border-r border-border flex flex-col min-h-0">
            <ChatSidebar
              chats={chats}
              selectedChat={selectedChat}
              onChatSelect={setSelectedChat}
              loading={loading}
            />
          </div>

          {/* Chat View - Independent scroll */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedChat ? (
              <ChatView chat={selectedChat} sessionId={id} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-background">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-medium text-foreground mb-1">OnWapp Web</h2>
                <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-1 md:hidden min-h-0">
          {selectedChat ? (
            <ChatView chat={selectedChat} sessionId={id} onBack={() => setSelectedChat(null)} />
          ) : (
            <ChatSidebar
              chats={chats}
              selectedChat={selectedChat}
              onChatSelect={setSelectedChat}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
