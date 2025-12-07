"use client"

import { useState, useEffect, use, useCallback } from "react"
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
        
        // Restore selected chat from URL and clear its unread count
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
    load()
  }, [sessionId, chatIdFromUrl])

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
        // Preserve unreadCount=0 for currently open chat (already marked as read locally)
        setChats(prev => data.map(chat => {
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
                    onClick={() => selectChat(chat)}
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
              myJid={myJid}
              onBack={() => selectChat(null)}
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
