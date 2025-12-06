"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Smartphone,
  Webhook,
  MessageCircle,
  MessageSquare,
  Settings2,
  Send,
  Users,
  Users2,
  ArrowLeft,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  Check,
  Loader2,
  Plug,
  User,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchSessions, createSession } from "@/lib/api/sessions"
import type { Session } from "@/lib/types/session"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SessionSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sessionId: string
}

export function SessionSidebar({ sessionId, ...props }: SessionSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile } = useSidebar()
  const baseUrl = `/sessions/${sessionId}`

  const [sessions, setSessions] = React.useState<Session[]>([])
  const [currentSession, setCurrentSession] = React.useState<Session | null>(null)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  
  // Create session dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [newSessionName, setNewSessionName] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const loadSessions = React.useCallback(async () => {
    try {
      const data = await fetchSessions()
      setSessions(data)
      const current = data.find(s => s.session === sessionId)
      if (current) {
        setCurrentSession(current)
      }
    } catch (error) {
      console.error("Failed to load sessions:", error)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadSessions()
    // Increase interval to 60 seconds to reduce API calls and avoid rate limits
    const interval = setInterval(loadSessions, 60000)
    return () => clearInterval(interval)
  }, [loadSessions])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-emerald-500"
      case "connecting":
        return "bg-amber-500"
      case "disconnected":
        return "bg-rose-500"
      default:
        return "bg-zinc-400"
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSessionName.trim()) return

    setCreating(true)
    try {
      await createSession({ session: newSessionName.trim() })
      toast.success("Sessão criada com sucesso!")
      setNewSessionName("")
      setCreateDialogOpen(false)
      await loadSessions()
      // Navegar para a nova sessão
      router.push(`/sessions/${newSessionName.trim()}`)
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar sessão")
    } finally {
      setCreating(false)
    }
  }

  const handleOpenCreateDialog = () => {
    setDropdownOpen(false)
    // Pequeno delay para o dropdown fechar antes de abrir o dialog
    setTimeout(() => {
      setCreateDialogOpen(true)
    }, 100)
  }

  const navItems = [
    {
      title: "Visão Geral",
      url: baseUrl,
      icon: Home,
    },
    {
      title: "Perfil",
      url: `${baseUrl}/profile`,
      icon: User,
    },
    {
      title: "Enviar Mensagem",
      url: `${baseUrl}/messages/send`,
      icon: Send,
    },
    {
      title: "Contatos",
      url: `${baseUrl}/contacts`,
      icon: Users,
    },
    {
      title: "Grupos",
      url: `${baseUrl}/groups`,
      icon: Users2,
    },
    {
      title: "Conversas",
      url: `${baseUrl}/chats`,
      icon: MessageSquare,
    },
    {
      title: "Integrações",
      url: `${baseUrl}/integrations`,
      icon: Plug,
      items: [
        {
          title: "Chatwoot",
          url: `${baseUrl}/integrations/chatwoot/config`,
          icon: MessageCircle,
        },
        {
          title: "Webhooks",
          url: `${baseUrl}/integrations/webhooks/config`,
          icon: Webhook,
        },
      ],
    },
    {
      title: "Configurações",
      url: `${baseUrl}/settings`,
      icon: Settings2,
    },
  ]

  const handleSessionChange = (newSessionId: string) => {
    // Mantém o mesmo caminho relativo mas troca a sessão
    const currentPath = pathname.replace(`/sessions/${sessionId}`, "")
    router.push(`/sessions/${newSessionId}${currentPath}`)
    setDropdownOpen(false)
  }

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="relative">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <Smartphone className="size-4" />
                      </div>
                      {currentSession && (
                        <span 
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar",
                            getStatusColor(currentSession.status)
                          )} 
                        />
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{sessionId}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {currentSession?.pushName || "Sessão WhatsApp"}
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
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Sessões ({sessions.length})
                  </DropdownMenuLabel>
                  <div className="max-h-[300px] overflow-y-auto">
                    {sessions.map((session) => (
                      <DropdownMenuItem
                        key={session.id}
                        onClick={() => handleSessionChange(session.session)}
                        className="gap-2 p-2 cursor-pointer"
                      >
                        <div className="relative">
                          <div className="flex size-8 items-center justify-center rounded-lg border bg-background">
                            <Smartphone className="size-4" />
                          </div>
                          <span 
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background",
                              getStatusColor(session.status)
                            )} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{session.session}</p>
                          {session.pushName && (
                            <p className="text-xs text-muted-foreground truncate">{session.pushName}</p>
                          )}
                        </div>
                        {session.session === sessionId && (
                          <Check className="size-4 text-emerald-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="gap-2 p-2 cursor-pointer"
                    onClick={handleOpenCreateDialog}
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg border bg-transparent">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">Nova Sessão</div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu da Sessão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const hasSubItems = item.items && item.items.length > 0
                  // Check if any subitem is active
                  const isSubItemActive = hasSubItems && item.items?.some(
                    sub => pathname === sub.url || pathname.startsWith(sub.url.replace('/config', ''))
                  )
                  const isActive = pathname === item.url || pathname.startsWith(item.url + "/") || isSubItemActive

                  if (!hasSubItems) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          tooltip={item.title} 
                          asChild
                          isActive={isActive}
                        >
                          <Link href={item.url}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  }

                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => {
                              const subBase = subItem.url.replace('/config', '')
                              const isSubActive = pathname === subItem.url || pathname.startsWith(subBase + '/')
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild isActive={isSubActive}>
                                    <Link href={subItem.url}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Voltar para sessões">
                <Link href="/sessions" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-4" />
                  <span>Todas as Sessões</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Dialog para criar nova sessão */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateSession}>
            <DialogHeader>
              <DialogTitle>Criar Nova Sessão</DialogTitle>
              <DialogDescription>
                Crie uma nova sessão WhatsApp. Você precisará escanear o QR Code após criar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-session">Nome da Sessão</Label>
                <Input
                  id="new-session"
                  placeholder="minha-sessao"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  disabled={creating}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Use apenas letras, números, hífens e underscores.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)} 
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={creating || !newSessionName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Sessão
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
