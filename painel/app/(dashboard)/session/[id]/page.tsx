"use client"

import * as React from "react"
import { use } from "react"
import { 
  Play, 
  Pause, 
  RotateCw, 
  LogOut, 
  QrCode,
  MessageSquare,
  Users,
  MessagesSquare,
  UserCircle,
} from "lucide-react"
import { toast } from "sonner"

import { SessionHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { SessionStatusBadge, QRCodeDialog } from "@/components/sessions"
import { getSession, connectSession, disconnectSession, restartSession, logoutSession } from "@/lib/actions"
import type { Session } from "@/types"

interface SessionPageProps {
  params: Promise<{ id: string }>
}

export default function SessionPage({ params }: SessionPageProps) {
  const { id } = use(params)
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [showQR, setShowQR] = React.useState(false)

  const fetchSession = React.useCallback(async () => {
    try {
      const data = await getSession(id)
      setSession(data)
    } catch (error) {
      console.error("Failed to fetch session:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 5000)
    return () => clearInterval(interval)
  }, [fetchSession])

  const handleConnect = async () => {
    setActionLoading(true)
    try {
      const result = await connectSession(id)
      toast.success(result.message)
      if (result.status === 'connecting') {
        setShowQR(true)
      }
      fetchSession()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conectar')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setActionLoading(true)
    try {
      const result = await disconnectSession(id)
      toast.success(result.message)
      fetchSession()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desconectar')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRestart = async () => {
    setActionLoading(true)
    try {
      const result = await restartSession(id)
      toast.success(result.message)
      fetchSession()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao reiniciar')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = async () => {
    setActionLoading(true)
    try {
      const result = await logoutSession(id)
      toast.success(result.message)
      fetchSession()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer logout')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <SessionHeader sessionId={id} />
        <div className="flex-1 p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <SessionHeader sessionId={id} />
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Sessao nao encontrada</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <SessionHeader sessionId={id} />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={session.profilePicture} />
                <AvatarFallback className="text-xl">
                  {session.session.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{session.session}</CardTitle>
                <CardDescription>
                  {session.pushName || session.phone || 'Sem informacoes'}
                </CardDescription>
              </div>
              <SessionStatusBadge status={session.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {session.status === 'disconnected' ? (
                <Button onClick={handleConnect} disabled={actionLoading}>
                  <Play className="mr-2 h-4 w-4" />
                  Conectar
                </Button>
              ) : (
                <Button variant="outline" onClick={handleDisconnect} disabled={actionLoading}>
                  <Pause className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              )}
              {session.status === 'connecting' && (
                <Button variant="outline" onClick={() => setShowQR(true)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Ver QR Code
                </Button>
              )}
              <Button variant="outline" onClick={handleRestart} disabled={actionLoading}>
                <RotateCw className="mr-2 h-4 w-4" />
                Reiniciar
              </Button>
              {session.status === 'connected' && (
                <Button variant="outline" onClick={handleLogout} disabled={actionLoading}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.stats?.messages || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Chats</CardTitle>
              <MessagesSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.stats?.chats || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contatos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.stats?.contacts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Grupos</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.stats?.groups || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">ID</dt>
                <dd className="mt-1 text-sm font-mono">{session.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Telefone</dt>
                <dd className="mt-1 text-sm">{session.phone || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Device JID</dt>
                <dd className="mt-1 text-sm font-mono truncate">{session.deviceJid || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Criado em</dt>
                <dd className="mt-1 text-sm">
                  {new Date(session.createdAt).toLocaleString('pt-BR')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <QRCodeDialog
        session={session}
        open={showQR}
        onOpenChange={setShowQR}
      />
    </>
  )
}
