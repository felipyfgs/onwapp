"use client"

import { use, useMemo } from "react"
import { usePathname } from "next/navigation"
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
import { Wifi, WifiOff } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChatSidebar } from "@/components/chats"
import { ChatsProvider, useChatsContext } from "@/lib/contexts/chats-context"
import { reconstructJid } from "@/lib/utils/jid"

interface ChatsLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

function ChatsLayoutContent({ children }: { children: React.ReactNode }) {
  const { sessionId, chats, loading, isConnected, highlightChatId } = useChatsContext()
  const pathname = usePathname()

  // Extract chatId from pathname: /sessions/[id]/chats/[chatId]
  const selectedChat = useMemo(() => {
    const match = pathname.match(/\/sessions\/[^/]+\/chats\/([^/]+)$/)
    if (match) {
      const chatId = match[1]
      const jid = reconstructJid(chatId)
      return chats.find((c) => c.jid === jid) || null
    }
    return null
  }, [pathname, chats])

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
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Conversas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-4 flex items-center gap-2">
          <ThemeToggle />
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop: Sidebar always visible */}
        <div className="hidden md:flex w-[360px] lg:w-[400px] shrink-0 border-r border-border flex-col min-h-0">
          <ChatSidebar
            chats={chats}
            selectedChat={selectedChat}
            sessionId={sessionId}
            loading={loading}
            highlightChatId={highlightChatId}
          />
        </div>

        {/* Page content */}
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ChatsLayout({ children, params }: ChatsLayoutProps) {
  const { id } = use(params)

  return (
    <ChatsProvider sessionId={id}>
      <ChatsLayoutContent>{children}</ChatsLayoutContent>
    </ChatsProvider>
  )
}
