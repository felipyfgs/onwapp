"use client"

import { useState, useEffect, use } from "react"
import { MessageSquare, Search, X } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { ChatListItem, ChatsSkeleton, ChatFilters, ChatWindow, type FilterType } from "@/components/chats"
import { getChats, type Chat } from "@/lib/api/chats"
import { cn } from "@/lib/utils"

export default function ChatsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getChats(sessionId)
        setChats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  // Refresh chats periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getChats(sessionId)
        setChats(data)
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [sessionId])

  const counts = {
    all: chats.filter(c => !c.archived).length,
    private: chats.filter(c => !c.isGroup && !c.archived).length,
    groups: chats.filter(c => c.isGroup && !c.archived).length,
    archived: chats.filter(c => c.archived).length,
  }

  const filteredChats = chats.filter(chat => {
    const matchesSearch = !search || 
      chat.name?.toLowerCase().includes(search.toLowerCase()) ||
      chat.jid.includes(search) ||
      chat.lastMessage?.content?.toLowerCase().includes(search.toLowerCase())
    
    let matchesFilter = true
    switch (filter) {
      case 'private':
        matchesFilter = !chat.isGroup && !chat.archived
        break
      case 'groups':
        matchesFilter = chat.isGroup && !chat.archived
        break
      case 'archived':
        matchesFilter = !!chat.archived
        break
      case 'all':
      default:
        matchesFilter = !chat.archived
    }
    
    return matchesSearch && matchesFilter
  })

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  const headerContent = (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-background">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/sessions">Sessoes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Conversas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )

  if (loading) {
    return (
      <>
        {headerContent}
        <ChatsSkeleton />
      </>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {headerContent}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chat list sidebar */}
        <div className={cn(
          "w-full md:w-96 md:min-w-96 flex flex-col border-r bg-background overflow-hidden",
          selectedChat && "hidden md:flex"
        )}>
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              <h1 className="text-lg font-semibold">Conversas</h1>
              {totalUnread > 0 && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {counts.all}
            </span>
          </div>

          {/* Search */}
          <div className="px-2 py-2 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar conversas"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 bg-background border-0 focus-visible:ring-1"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <ChatFilters 
            filter={filter} 
            onFilterChange={setFilter} 
            counts={counts}
          />

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="size-12 mb-4 opacity-50" />
                <p className="text-sm">
                  {search 
                    ? 'Nenhuma conversa encontrada' 
                    : filter === 'archived'
                      ? 'Nenhuma conversa arquivada'
                      : 'Nenhuma conversa'}
                </p>
              </div>
            ) : (
              <div>
                {filteredChats.map((chat) => (
                  <ChatListItem
                    key={chat.jid}
                    chat={chat}
                    selected={selectedChat?.jid === chat.jid}
                    onClick={() => setSelectedChat(chat)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className={cn(
          "flex-1 flex flex-col min-h-0 overflow-hidden",
          !selectedChat && "hidden md:flex"
        )}>
          {selectedChat ? (
            <ChatWindow
              sessionId={sessionId}
              chat={selectedChat}
              onBack={() => setSelectedChat(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
              <MessageSquare className="size-16 mb-4 opacity-30" />
              <h2 className="text-xl font-medium mb-2">OnWapp Web</h2>
              <p className="text-sm text-center max-w-md">
                Selecione uma conversa para ver as mensagens
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
