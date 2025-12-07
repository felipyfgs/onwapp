"use client"

import { useState, useEffect, use } from "react"
import { MessageSquare, Search, X, Filter } from "lucide-react"
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
    <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-card">
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
          "w-full md:w-[400px] md:min-w-[340px] md:max-w-[500px] flex flex-col border-r bg-card overflow-hidden",
          selectedChat && "hidden md:flex"
        )}>
          {/* Search header */}
          <div className="px-3 py-2 bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Pesquisar ou comecar uma nova conversa"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10 h-[35px] bg-muted/50 border-0 rounded-lg text-[15px] placeholder:text-muted-foreground focus-visible:ring-1"
              />
              {search ? (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-[18px]" />
                </button>
              ) : (
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground" />
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
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <MessageSquare className="size-16 mb-4 opacity-30" />
                <p className="text-[15px]">
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
                    sessionId={sessionId}
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
            <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 text-muted-foreground">
              <div className="w-[320px] text-center">
                <div className="size-[180px] mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
                  <MessageSquare className="size-20 opacity-30" />
                </div>
                <h2 className="text-[28px] font-light text-foreground/80 mb-3">OnWapp Web</h2>
                <p className="text-[14px] text-muted-foreground leading-[20px]">
                  Envie e receba mensagens sem precisar manter seu celular online.
                </p>
                <p className="text-[14px] text-muted-foreground leading-[20px] mt-4">
                  Use o WhatsApp em ate 4 dispositivos ao mesmo tempo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
