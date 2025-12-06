"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { SessionSidebar } from "@/components/sessions/session-sidebar"
import { AppHeader } from "@/components/app-header"
import { QRCodeDialog } from "@/components/sessions/qr-code-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  Smartphone, 
  Power, 
  PowerOff, 
  RefreshCw, 
  LogOut,
  MessageSquare,
  Users,
  MessagesSquare,
  QrCode,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react"
import type { Session } from "@/lib/types/session"
import {
  fetchSessions,
  connectSession,
  disconnectSession,
  logoutSession,
  restartSession,
} from "@/lib/api/sessions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const loadSession = useCallback(async () => {
    try {
      const sessions = await fetchSessions()
      const found = sessions.find(s => s.session === sessionId)
      if (found) {
        setSession(found)
      } else {
        toast.error("Sessão não encontrada")
        router.push("/sessions")
      }
    } catch (error) {
      console.error("Failed to fetch session:", error)
      toast.error("Erro ao carregar sessão")
    } finally {
      setLoading(false)
    }
  }, [sessionId, router])

  useEffect(() => {
    loadSession()
    // Increase interval to 30 seconds to reduce API calls
    const interval = setInterval(loadSession, 30000)
    return () => clearInterval(interval)
  }, [loadSession])

  const handleConnect = async () => {
    setActionLoading("connect")
    try {
      const response = await connectSession(sessionId)
      
      if (response.status === "connected") {
        toast.success("Sessão já está conectada!")
        await loadSession()
      } else {
        // Abre o dialog de QR Code
        setQrDialogOpen(true)
      }
    } catch (error: any) {
      // Mesmo com erro, tenta abrir o QR dialog
      setQrDialogOpen(true)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisconnect = async () => {
    setActionLoading("disconnect")
    try {
      await disconnectSession(sessionId)
      toast.success("Sessão desconectada")
      await loadSession()
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar sessão")
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    if (!confirm("Tem certeza que deseja fazer logout? Você precisará escanear o QR Code novamente.")) {
      return
    }
    setActionLoading("logout")
    try {
      await logoutSession(sessionId)
      toast.success("Logout realizado")
      await loadSession()
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar logout")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestart = async () => {
    setActionLoading("restart")
    try {
      await restartSession(sessionId)
      toast.success("Sessão reiniciada")
      await loadSession()
    } catch (error: any) {
      toast.error(error.message || "Erro ao reiniciar sessão")
    } finally {
      setActionLoading(null)
    }
  }

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado"
      case "connecting":
        return "Conectando"
      case "disconnected":
        return "Desconectado"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <SessionSidebar sessionId={sessionId} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!session) {
    return null
  }

  return (
    <SidebarProvider>
      <SessionSidebar sessionId={sessionId} />
      <SidebarInset>
        <AppHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{sessionId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </AppHeader>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Session Header Card */}
          <Card className="overflow-hidden">
            <div className={cn(
              "h-2",
              session.status === "connected" && "bg-gradient-to-r from-emerald-500 to-teal-500",
              session.status === "connecting" && "bg-gradient-to-r from-amber-500 to-orange-500",
              session.status === "disconnected" && "bg-gradient-to-r from-rose-500 to-pink-500"
            )} />
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {session.profilePicture ? (
                      <img 
                        src={session.profilePicture} 
                        alt={session.pushName || session.session}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
                        <Smartphone className="h-8 w-8 text-emerald-600" />
                      </div>
                    )}
                    <span 
                      className={cn(
                        "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-background",
                        getStatusColor(session.status)
                      )} 
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">{session.session}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "gap-1",
                          session.status === "connected" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                          session.status === "connecting" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          session.status === "disconnected" && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                        )}
                      >
                        {session.status === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {getStatusText(session.status)}
                      </Badge>
                      {session.pushName && (
                        <span className="text-sm text-muted-foreground">{session.pushName}</span>
                      )}
                      {session.phone && (
                        <span className="text-sm text-muted-foreground">• {session.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {session.status === "connected" ? (
                    <Button 
                      variant="outline" 
                      onClick={handleDisconnect}
                      disabled={actionLoading !== null}
                    >
                      <PowerOff className="mr-2 h-4 w-4" />
                      {actionLoading === "disconnect" ? "Desconectando..." : "Desconectar"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleConnect}
                      disabled={actionLoading !== null}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {actionLoading === "connect" ? "Conectando..." : "Conectar"}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleRestart}
                    disabled={actionLoading !== null}
                  >
                    <RefreshCw className={cn("mr-2 h-4 w-4", actionLoading === "restart" && "animate-spin")} />
                    Reiniciar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleLogout}
                    disabled={actionLoading !== null}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{session.stats?.messages?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Total processadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chats</CardTitle>
                <MessagesSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{session.stats?.chats?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Conversas ativas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{session.stats?.contacts?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Salvos na sessão</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Grupos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{session.stats?.groups?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Participando</p>
              </CardContent>
            </Card>
          </div>

          {/* Connection Section */}
          {session.status === "disconnected" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Conectar via QR Code
                </CardTitle>
                <CardDescription>
                  Escaneie o QR Code com o WhatsApp para conectar esta sessão
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-muted mb-4">
                  <QrCode className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                  Clique no botão abaixo para gerar o QR Code e conectar sua sessão ao WhatsApp
                </p>
                <Button 
                  onClick={handleConnect}
                  disabled={actionLoading !== null}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  Gerar QR Code
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Connected Info */}
          {session.status === "connected" && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-emerald-600" />
                  Informações da Conexão
                </CardTitle>
                <CardDescription>Detalhes da sessão conectada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Nome</p>
                      <p className="text-base">{session.pushName || "Não disponível"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="text-base font-mono">{session.phone || "Não disponível"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">ID da Sessão</p>
                      <p className="text-base font-mono">{session.session}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Wifi className="mr-1 h-3 w-3" />
                        {getStatusText(session.status)}
                      </Badge>
                    </div>
                  </div>
                  {session.createdAt && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Criada em</p>
                      <p className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(session.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connecting State */}
          {session.status === "connecting" && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                  <RefreshCw className="h-8 w-8 text-amber-600 animate-spin" />
                </div>
                <p className="text-lg font-semibold">Conectando...</p>
                <p className="text-sm text-muted-foreground mt-1">Aguarde enquanto a sessão é estabelecida</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setQrDialogOpen(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Escanear QR Code
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>

      {/* QR Code Dialog */}
      <QRCodeDialog
        session={sessionId}
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        onConnected={loadSession}
      />
    </SidebarProvider>
  )
}
