"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Plus, MessageSquare } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog"
import { getSessions, ApiSession } from "@/lib/api"

interface SessionSwitcherProps {
  currentSessionId: string
}

export function SessionSwitcher({ currentSessionId }: SessionSwitcherProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [sessions, setSessions] = React.useState<ApiSession[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const data = await getSessions()
      setSessions(data)
    } catch (err) {
      console.error("Error fetching sessions:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchSessions()
  }, [])

  const currentSession = sessions.find(s => s.session === currentSessionId)
  const otherSessions = sessions.filter(s => s.session !== currentSessionId)

  const handleSessionChange = (sessionId: string) => {
    router.push(`/sessions/${sessionId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-primary"
      case "connecting": return "bg-muted-foreground"
      default: return "bg-destructive"
    }
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
                <MessageSquare className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{currentSessionId}</span>
                <span className="truncate text-xs">
                  {currentSession?.pushName || "Sessão WhatsApp"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Sessões
            </DropdownMenuLabel>
            
            {/* Current session */}
            <DropdownMenuItem className="gap-2 p-2 bg-accent">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <MessageSquare className="size-3.5 shrink-0" />
              </div>
              <div className="flex-1 truncate">{currentSessionId}</div>
              <div className={`size-2 rounded-full ${getStatusColor(currentSession?.status || "disconnected")}`} />
            </DropdownMenuItem>

            {/* Other sessions */}
            {otherSessions.map((session, index) => (
              <DropdownMenuItem
                key={session.id}
                onClick={() => handleSessionChange(session.session)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <MessageSquare className="size-3.5 shrink-0" />
                </div>
                <div className="flex-1 truncate">{session.session}</div>
                <div className={`size-2 rounded-full ${getStatusColor(session.status)}`} />
                <DropdownMenuShortcut>⌘{index + 2}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}

            {loading && sessions.length === 0 && (
              <>
                <div className="flex items-center gap-2 p-2">
                  <Skeleton className="size-6 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="flex items-center gap-2 p-2">
                  <Skeleton className="size-6 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </>
            )}

            <DropdownMenuSeparator />
            
            <CreateSessionDialog
              onSuccess={() => {
                fetchSessions()
              }}
              trigger={
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">Nova sessão</div>
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
