"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Plus, Wifi, WifiOff, Loader2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export interface SessionItem {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'connecting'
  phone?: string
}

interface SessionSwitcherProps {
  sessions: SessionItem[]
  currentSessionId: string
  onAddSession?: () => void
}

function StatusIcon({ status }: { status: SessionItem['status'] }) {
  switch (status) {
    case 'connected':
      return <Wifi className="size-4 text-green-500" />
    case 'connecting':
      return <Loader2 className="size-4 text-yellow-500 animate-spin" />
    default:
      return <WifiOff className="size-4 text-red-500" />
  }
}

function StatusDot({ status }: { status: SessionItem['status'] }) {
  const colors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  }
  return (
    <span className={`size-2 rounded-full ${colors[status]}`} />
  )
}

export function SessionSwitcher({
  sessions,
  currentSessionId,
  onAddSession,
}: SessionSwitcherProps) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  
  const currentSession = sessions.find(s => s.id === currentSessionId || s.name === currentSessionId)

  const handleSessionChange = (session: SessionItem) => {
    router.push(`/sessions/${session.name}`)
  }

  // Fallback se nao encontrar a sessao
  const displaySession = currentSession || {
    id: currentSessionId,
    name: currentSessionId,
    status: 'disconnected' as const,
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <StatusIcon status={displaySession.status} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displaySession.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {displaySession.phone || displaySession.status}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Sessoes
            </DropdownMenuLabel>
            {sessions.map((session, index) => (
              <DropdownMenuItem
                key={session.id}
                onClick={() => handleSessionChange(session)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <StatusDot status={session.status} />
                </div>
                <div className="flex-1 truncate">{session.name}</div>
                {session.phone && (
                  <span className="text-xs text-muted-foreground">{session.phone}</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 p-2"
              onClick={onAddSession}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Nova Sessao</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
