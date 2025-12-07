"use client"

import { useState, useEffect, use } from "react"
import { Loader2, MessageSquare, Users, User, Search, Archive, Check } from "lucide-react"
import Link from "next/link"
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
import { Button } from "@/components/ui/button"
import { getChats, type Chat } from "@/lib/api/chats"

type FilterType = 'all' | 'private' | 'groups'

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

  const filteredChats = chats.filter(chat => {
    const matchesSearch = !search || 
      chat.name?.toLowerCase().includes(search.toLowerCase()) ||
      chat.pushName?.toLowerCase().includes(search.toLowerCase()) ||
      chat.jid.includes(search)
    
    const matchesFilter = filter === 'all' || 
      (filter === 'groups' && chat.isGroup) ||
      (filter === 'private' && !chat.isGroup)
    
    return matchesSearch && matchesFilter
  })

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Ontem'
    if (days < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const getDisplayName = (chat: Chat) => {
    return chat.name || chat.pushName || chat.jid.split('@')[0]
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="size-6" />
              Conversas
            </h1>
            <p className="text-muted-foreground">
              {chats.length} conversas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'private' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('private')}
            >
              <User className="size-4 mr-1" />
              Privadas
            </Button>
            <Button
              variant={filter === 'groups' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('groups')}
            >
              <Users className="size-4 mr-1" />
              Grupos
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="size-12 mb-4" />
            <p>{search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}</p>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {filteredChats.map((chat) => (
              <div
                key={chat.jid}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  {chat.isGroup ? (
                    <Users className="size-5 text-muted-foreground" />
                  ) : (
                    <User className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{getDisplayName(chat)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage || chat.jid.split('@')[0]}
                  </p>
                </div>
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <span className="flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs">
                    {chat.unreadCount}
                  </span>
                )}
                {chat.archived && (
                  <Archive className="size-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
