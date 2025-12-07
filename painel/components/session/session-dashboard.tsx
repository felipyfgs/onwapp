"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  Power, 
  PowerOff, 
  RefreshCw,
  QrCode,
  User,
  MessageSquare,
  Users,
  UsersRound,
  LogOut,
  Phone,
} from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  connectSession, 
  disconnectSession, 
  restartSession,
  logoutSession,
  getSessionQR,
  getSessionStatus,
  type SessionStats,
} from "@/lib/api/sessions"

type SessionStatusType = 'connected' | 'disconnected' | 'connecting'

interface SessionDashboardProps {
  sessionId: string
  initialStatus: SessionStatusType
  phone?: string
  pushName?: string
  profilePicture?: string
  stats?: SessionStats
}

export function SessionDashboard({ 
  sessionId, 
  initialStatus,
  phone: initialPhone,
  pushName: initialPushName,
  profilePicture: initialPicture,
  stats: initialStats,
}: SessionDashboardProps) {
  const [status, setStatus] = useState<SessionStatusType>(initialStatus)
  const [phone, setPhone] = useState(initialPhone)
  const [pushName, setPushName] = useState(initialPushName)
  const [profilePicture, setProfilePicture] = useState(initialPicture)
  const [stats, setStats] = useState<SessionStats | undefined>(initialStats)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getSessionStatus(sessionId)
      const newStatus = data.status as SessionStatusType
      setStatus(newStatus)
      if (data.phone) setPhone(data.phone)
      if (data.pushName) setPushName(data.pushName)
      if (data.profilePicture) setProfilePicture(data.profilePicture)
      if (data.stats) setStats(data.stats)
    } catch {
      // Ignore errors on status check
    }
  }, [sessionId])

  const fetchQR = useCallback(async () => {
    try {
      const data = await getSessionQR(sessionId)
      if (data.qr) {
        setQrCode(data.qr)
      }
      if (data.status === 'connected') {
        setStatus('connected')
        fetchStatus()
      }
    } catch {
      setQrCode(null)
    }
  }, [sessionId, fetchStatus])

  useEffect(() => {
    if (status === 'connecting') {
      fetchQR()
      const interval = setInterval(fetchQR, 2000)
      return () => clearInterval(interval)
    } else if (status === 'disconnected') {
      setQrCode(null)
    }
  }, [status, fetchQR])

  useEffect(() => {
    if (status === 'connected') {
      fetchStatus()
      const interval = setInterval(fetchStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [status, fetchStatus])

  const handleAction = async (action: 'connect' | 'disconnect' | 'restart' | 'logout') => {
    setLoading(action)
    setError(null)
    try {
      switch (action) {
        case 'connect':
          await connectSession(sessionId)
          setStatus('connecting')
          break
        case 'disconnect':
          await disconnectSession(sessionId)
          setStatus('disconnected')
          setQrCode(null)
          break
        case 'restart':
          await restartSession(sessionId)
          setStatus('connecting')
          break
        case 'logout':
          await logoutSession(sessionId)
          setStatus('disconnected')
          setQrCode(null)
          setPhone(undefined)
          setPushName(undefined)
          setProfilePicture(undefined)
          setStats(undefined)
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na operacao')
    } finally {
      setLoading(null)
    }
  }

  const StatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="size-5 text-green-500" />
      case 'connecting':
        return <Loader2 className="size-5 text-yellow-500 animate-spin" />
      default:
        return <WifiOff className="size-5 text-red-500" />
    }
  }

  const statusText = {
    connected: 'Conectado',
    connecting: 'Conectando...',
    disconnected: 'Desconectado',
  }

  const statusColor = {
    connected: 'text-green-500',
    connecting: 'text-yellow-500',
    disconnected: 'text-red-500',
  }

  const formatPhone = (p?: string) => {
    if (!p) return null
    if (p.startsWith('+')) return p
    return `+${p}`
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
              <BreadcrumbItem>
                <BreadcrumbPage>{sessionId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <StatusIcon />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${statusColor[status]}`}>
                {statusText[status]}
              </div>
              {formatPhone(phone) && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Phone className="size-3" />
                  {formatPhone(phone)}
                </p>
              )}
            </CardContent>
          </Card>

          <Link href={`/sessions/${sessionId}/chats`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas</CardTitle>
                <MessageSquare className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.chats ?? '-'}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.messages ? `${stats.messages} mensagens` : 'Chats ativos'}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/sessions/${sessionId}/contacts`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.contacts ?? '-'}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de contatos
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/sessions/${sessionId}/groups`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Grupos</CardTitle>
                <UsersRound className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.groups ?? '-'}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Grupos ativos
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* QR Code / Connected State */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status === 'connected' ? (
                  <User className="size-5" />
                ) : (
                  <QrCode className="size-5" />
                )}
                {status === 'connected' ? 'Perfil' : 'QR Code'}
              </CardTitle>
              <CardDescription>
                {status === 'connected' 
                  ? 'Informacoes do WhatsApp conectado'
                  : status === 'connecting'
                  ? 'Escaneie o QR Code com seu WhatsApp'
                  : 'Clique em Conectar para gerar o QR Code'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[280px]">
              {status === 'connected' ? (
                <div className="text-center space-y-4">
                  <Avatar className="size-24 mx-auto">
                    <AvatarImage src={profilePicture} />
                    <AvatarFallback className="text-2xl">
                      {pushName?.[0]?.toUpperCase() || <User className="size-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-semibold">{pushName || 'Sem nome'}</p>
                    {formatPhone(phone) && (
                      <p className="text-muted-foreground">{formatPhone(phone)}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <Wifi className="size-4" />
                    <span className="text-sm">Conectado</span>
                  </div>
                </div>
              ) : status === 'connecting' && qrCode ? (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <img 
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code"
                    className="size-56"
                  />
                </div>
              ) : status === 'connecting' ? (
                <div className="text-center text-muted-foreground">
                  <Loader2 className="size-12 mx-auto mb-3 animate-spin" />
                  <p>Gerando QR Code...</p>
                  <p className="text-xs mt-1">Aguarde alguns segundos</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <QrCode className="size-16 mx-auto mb-4 opacity-30" />
                  <p>Sessao desconectada</p>
                  <p className="text-xs mt-1">Clique em Conectar para iniciar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acoes</CardTitle>
              <CardDescription>
                Gerenciar conexao da sessao
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {status === 'disconnected' && (
                <Button 
                  className="w-full" 
                  onClick={() => handleAction('connect')}
                  disabled={loading !== null}
                >
                  {loading === 'connect' ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Power className="size-4 mr-2" />
                  )}
                  Conectar
                </Button>
              )}

              {status === 'connecting' && (
                <>
                  <Button variant="outline" className="w-full" disabled>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Aguardando QR Code...
                  </Button>
                  <Button 
                    variant="destructive"
                    className="w-full" 
                    onClick={() => handleAction('disconnect')}
                    disabled={loading !== null}
                  >
                    {loading === 'disconnect' ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <PowerOff className="size-4 mr-2" />
                    )}
                    Cancelar
                  </Button>
                </>
              )}

              {status === 'connected' && (
                <>
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => handleAction('restart')}
                    disabled={loading !== null}
                  >
                    {loading === 'restart' ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4 mr-2" />
                    )}
                    Reiniciar Conexao
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => handleAction('disconnect')}
                    disabled={loading !== null}
                  >
                    {loading === 'disconnect' ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <PowerOff className="size-4 mr-2" />
                    )}
                    Desconectar (manter credenciais)
                  </Button>

                  <Button 
                    variant="destructive"
                    className="w-full" 
                    onClick={() => {
                      if (confirm('Isso vai deslogar e exigir novo QR Code. Continuar?')) {
                        handleAction('logout')
                      }
                    }}
                    disabled={loading !== null}
                  >
                    {loading === 'logout' ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="size-4 mr-2" />
                    )}
                    Logout (novo QR necessario)
                  </Button>
                </>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Desconectar:</strong> Mantem credenciais, reconecta automaticamente.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Logout:</strong> Remove credenciais, precisa escanear QR novamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
