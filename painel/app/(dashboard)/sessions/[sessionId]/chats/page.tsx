"use client"

import { useState, useEffect, use, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { getSessionStatus } from "@/lib/api/sessions"
import { useRealtime, type NewMessageData } from "@/hooks/use-realtime"
import { cn } from "@/lib/utils"

export default function ChatsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatIdFromUrl = searchParams.get('chat')
  
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [myJid, setMyJid] = useState<string | undefined>()
  
  // Track if we've done the initial load to avoid restoring from URL on every URL change
  const initialLoadDoneRef = useRef(false)

  // Extract phone/group id from JID (removes @s.whatsapp.net or @g.us)
  const getIdFromJid = (jid: string) => jid.split('@')[0]
  
  // Find chat by phone/group id (supports both full JID and just the ID)
  const findChatById = (chatList: Chat[], id: string) => 
    chatList.find(c => c.jid === id || c.jid.startsWith(id + '@'))

  // Update URL when chat is selected (uses clean ID without @domain)
  const selectChat = useCallback((chat: Chat | null) => {
    setSelectedChat(chat)
    if (chat) {
      const chatId = getIdFromJid(chat.jid)
      router.replace(`/sessions/${sessionId}/chats?chat=${chatId}`, { scroll: false })
      
      // Clear unread count when opening a chat
      setChats(prev => prev.map(c => 
        c.jid === chat.jid ? { ...c, unreadCount: 0, markedAsUnread: false } : c
      ))
    } else {
      router.replace(`/sessions/${sessionId}/chats`, { scroll: false })
    }
  }, [router, sessionId])

  useEffect(() => {
    async function load() {
      try {
        const [data, session] = await Promise.all([
          getChats(sessionId),
          getSessionStatus(sessionId),
        ])
        setMyJid(session.deviceJid || undefined)
        
        // Only restore selected chat from URL on FIRST load (mount)
        // After that, user clicks control the selectedChat state via selectChat()
        if (chatIdFromUrl && data.length > 0) {
          const chatFromUrl = findChatById(data, chatIdFromUrl)
          if (chatFromUrl) {
            setSelectedChat(chatFromUrl)
            // Clear unread for the selected chat
            setChats(data.map(c => 
              c.jid === chatFromUrl.jid ? { ...c, unreadCount: 0, markedAsUnread: false } : c
            ))
          } else {
            setChats(data)
          }
        } else {
          setChats(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    
    // Only run on mount (sessionId shouldn't change in practice)
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Refresh chats when new message arrives via SSE
  const handleNewMessage = useCallback((data: NewMessageData) => {
    setChats(prev => {
      const chatIndex = prev.findIndex(c => c.jid === data.chatJid)
      
      if (chatIndex === -1) {
        // New chat - reload full list
        getChats(sessionId).then(setChats).catch(() => {})
        return prev
      }
      
      // Update existing chat with new message info
      const updated = [...prev]
      const chat = { ...updated[chatIndex] }
      chat.lastMessage = {
        content: data.content,
        timestamp: data.timestamp,
        fromMe: data.fromMe,
        type: data.type,
        mediaType: data.mediaType,
        pushName: data.pushName,
        senderJid: data.senderJid,
      }
      chat.conversationTimestamp = data.timestamp
      
      // Only increment unread if message is not from us AND chat is not currently open
      const isChatOpen = selectedChat?.jid === data.chatJid
      if (!data.fromMe && !isChatOpen) {
        chat.unreadCount = (chat.unreadCount || 0) + 1
      }
      
      // Move chat to top (most recent)
      updated.splice(chatIndex, 1)
      updated.unshift(chat)
      
      return updated
    })
  }, [sessionId, selectedChat?.jid])

  useRealtime({
    sessionId,
    onMessage: handleNewMessage,
  })

  // Fallback polling (reduced frequency since we have SSE)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getChats(sessionId)
        // Preserve unreadCount=0 for currently open chat
        setChats(data.map(chat => {
          if (selectedChat?.jid === chat.jid) {
            return { ...chat, unreadCount: 0, markedAsUnread: false }
          }
          return chat
        }))
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  }, [sessionId, selectedChat?.jid])

  const counts = {
    all: chats.filter(c => !c.archived).length,
    unread: chats.filter(c => !c.archived && ((c.unreadCount && c.unreadCount > 0) || c.markedAsUnread)).length,
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
      case 'unread':
        matchesFilter = !chat.archived && ((chat.unreadCount && chat.unreadCount > 0) || !!chat.markedAsUnread)
        break
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
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in-0 duration-500">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full" />
                  <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10 p-8 rounded-full">
                    <MessageSquare className="size-16 text-primary/70" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {search 
                    ? 'Nenhuma conversa encontrada' 
                    : filter === 'archived'
                      ? 'Nenhuma conversa arquivada'
                      : 'Nenhuma conversa ainda'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
                  {search 
                    ? 'Tente buscar por outro termo ou limpe o filtro'
                    : filter === 'archived'
                      ? 'As conversas arquivadas aparecerao aqui'
                      : 'Suas conversas do WhatsApp aparecerao aqui quando voce receber mensagens'}
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in-0 duration-300">
                {filteredChats.map((chat, index) => (
                  <div 
                    key={chat.jid}
                    className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                    style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
                  >
                    <ChatListItem
                      chat={chat}
                      sessionId={sessionId}
                      selected={selectedChat?.jid === chat.jid}
                      onClick={() => selectChat(chat)}
                    />
                  </div>
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
              myJid={myJid}
              onBack={() => selectChat(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/5 to-background text-muted-foreground animate-in fade-in-0 duration-700">
              <div className="w-[360px] text-center px-6">
                <div className="relative size-[200px] mx-auto mb-8">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 blur-3xl rounded-full animate-pulse" />
                  
                  {/* Icon container with gradient border */}
                  <div className="relative size-full rounded-full bg-gradient-to-br from-primary/20 via-purple-500/10 to-background flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
                    <div className="bg-gradient-to-br from-background to-muted/50 rounded-full p-12 backdrop-blur-sm">
                      <MessageSquare className="size-24 text-primary/70" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-[32px] font-light bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-4">
                  OnWapp Web
                </h2>
                
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-3">
                  Envie e receba mensagens sem precisar manter seu celular online.
                </p>
                
                <p className="text-[14px] text-muted-foreground/80 leading-relaxed">
                  Use o WhatsApp em ate 4 dispositivos ao mesmo tempo.
                </p>
                
                {/* Decorative dots */}
                <div className="flex items-center justify-center gap-2 mt-8 opacity-30">
                  <div className="size-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="size-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="size-2 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
