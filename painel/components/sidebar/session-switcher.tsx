"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Plus, Loader2, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { createSession } from "@/lib/api/sessions"

export interface SessionItem {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'connecting'
  phone?: string
  pushName?: string
  profilePicture?: string
}

interface SessionSwitcherProps {
  sessions: SessionItem[]
  currentSessionId: string
}

function StatusDot({ status }: { status: SessionItem['status'] }) {
  const colors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-red-500',
  }
  return (
    <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background ${colors[status]}`} />
  )
}

export function SessionSwitcher({
  sessions,
  currentSessionId,
}: SessionSwitcherProps) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const [isCreating, setIsCreating] = React.useState(false)
  const [newSessionName, setNewSessionName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  
  const currentSession = sessions.find(s => s.id === currentSessionId || s.name === currentSessionId)

  const handleSessionChange = (session: SessionItem) => {
    router.push(`/sessions/${session.name}`)
  }

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return
    setLoading(true)
    try {
      await createSession(newSessionName.trim())
      router.push(`/sessions/${newSessionName.trim()}`)
      setNewSessionName("")
      setIsCreating(false)
    } catch {
      // Error handling silently
    } finally {
      setLoading(false)
    }
  }

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
              <div className="relative">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={displaySession.profilePicture} />
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {displaySession.pushName?.[0]?.toUpperCase() || displaySession.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <StatusDot status={displaySession.status} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displaySession.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {displaySession.pushName || displaySession.phone || displaySession.status}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs px-2">
              Sessoes ({sessions.length})
            </DropdownMenuLabel>
            
            <div className="max-h-64 overflow-y-auto">
              {sessions.map((session) => (
                <DropdownMenuItem
                  key={session.id}
                  onClick={() => handleSessionChange(session)}
                  className="gap-3 p-2"
                >
                  <div className="relative">
                    <Avatar className="size-8">
                      <AvatarImage src={session.profilePicture} />
                      <AvatarFallback className="text-xs">
                        {session.pushName?.[0]?.toUpperCase() || session.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <StatusDot status={session.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.pushName || session.phone || session.status}
                    </p>
                  </div>
                  {(session.id === currentSessionId || session.name === currentSessionId) && (
                    <Check className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator />
            
            {isCreating ? (
              <div className="p-2 space-y-2">
                <Input
                  placeholder="Nome da sessao"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                  className="h-8 text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-7" onClick={handleCreateSession} disabled={loading || !newSessionName.trim()}>
                    {loading ? <Loader2 className="size-3 animate-spin" /> : "Criar"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => { setIsCreating(false); setNewSessionName("") }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <DropdownMenuItem 
                className="gap-3 p-2"
                onClick={(e) => { e.preventDefault(); setIsCreating(true) }}
              >
                <div className="flex size-8 items-center justify-center rounded-full border border-dashed">
                  <Plus className="size-4" />
                </div>
                <span className="text-muted-foreground">Nova Sessao</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
