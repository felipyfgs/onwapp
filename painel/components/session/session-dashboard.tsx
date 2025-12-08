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
  Smartphone,
  X,
  Copy,
  Check,
  Key,
  Calendar,
  Settings,
  Webhook,
  Eye,
  EyeOff,
  ExternalLink,
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  connectSession, 
  disconnectSession, 
  restartSession,
  logoutSession,
  getSessionQR,
  getSessionStatus,
  getSessionProfile,
  pairPhone,
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
  apiKey?: string
  createdAt?: string
}

export function SessionDashboard({ 
  sessionId, 
  initialStatus,
  phone: initialPhone,
  pushName: initialPushName,
  profilePicture: initialPicture,
  stats: initialStats,
  apiKey: initialApiKey,
  createdAt: initialCreatedAt,
}: SessionDashboardProps) {
  const [status, setStatus] = useState<SessionStatusType>(initialStatus)
  const [phone, setPhone] = useState(initialPhone)
  const [pushName, setPushName] = useState(initialPushName)
  const [profilePicture, setProfilePicture] = useState(initialPicture)
  const [stats, setStats] = useState<SessionStats | undefined>(initialStats)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [connectMethod, setConnectMethod] = useState<'qr' | 'phone'>('qr')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getSessionStatus(sessionId)
      const newStatus = data.status as SessionStatusType
      setStatus(newStatus)
      if (data.phone) setPhone(data.phone)
      if (data.pushName) setPushName(data.pushName)
      if (data.stats) setStats(data.stats)
      
      // Fetch profile picture from /profile endpoint when connected
      if (newStatus === 'connected') {
        try {
          const profile = await getSessionProfile(sessionId)
          if (profile.pushName) setPushName(profile.pushName)
          if ('profile' in profile && profile.profile && typeof profile.profile === 'object' && 'pictureUrl' in profile.profile) {
            setProfilePicture(profile.profile.pictureUrl as string)
          }
        } catch {
          // Ignore profile fetch errors
        }
      }
      
      if (newStatus === 'connected' && showConnectDialog) {
        setShowConnectDialog(false)
        setPairingCode(null)
        setQrCode(null)
      }
    } catch {
      // Ignore errors on status check
    }
  }, [sessionId, showConnectDialog])

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
    if (status === 'connecting' && showConnectDialog && connectMethod === 'qr') {
      fetchQR()
      const interval = setInterval(fetchQR, 2000)
      return () => clearInterval(interval)
    }
  }, [status, showConnectDialog, connectMethod, fetchQR])

  useEffect(() => {
    if (status === 'connecting') {
      const interval = setInterval(fetchStatus, 3000)
      return () => clearInterval(interval)
    } else if (status === 'connected') {
      const interval = setInterval(fetchStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [status, fetchStatus])

  // Auto open dialog if connecting on page load
  useEffect(() => {
    if (initialStatus === 'connecting') {
      setShowConnectDialog(true)
    }
  }, [initialStatus])

  const handleConnect = async () => {
    setLoading('connect')
    setError(null)
    try {
      await connectSession(sessionId)
      setStatus('connecting')
      setShowConnectDialog(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar')
    } finally {
      setLoading(null)
    }
  }

  const handlePairPhone = async () => {
    if (!phoneNumber.trim()) return
    setLoading('pair')
    setError(null)
    try {
      if (status !== 'connecting') {
        await connectSession(sessionId)
        setStatus('connecting')
      }
      
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      const result = await pairPhone(sessionId, cleanPhone)
      setPairingCode(result.code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar código')
    } finally {
      setLoading(null)
    }
  }

  const handleDisconnect = async () => {
    setLoading('disconnect')
    setError(null)
    try {
      await disconnectSession(sessionId)
      setStatus('disconnected')
      setQrCode(null)
      setShowConnectDialog(false)
      setPairingCode(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar')
    } finally {
      setLoading(null)
    }
  }

  const handleRestart = async () => {
    setLoading('restart')
    setError(null)
    try {
      await restartSession(sessionId)
      setStatus('connecting')
      setShowConnectDialog(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reiniciar')
    } finally {
      setLoading(null)
    }
  }

  const handleLogout = async () => {
    setLoading('logout')
    setError(null)
    try {
      await logoutSession(sessionId)
      setStatus('disconnected')
      setQrCode(null)
      setPhone(undefined)
      setPushName(undefined)
      setProfilePicture(undefined)
      setStats(undefined)
      setShowLogoutDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer logout')
    } finally {
      setLoading(null)
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for HTTP
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  const closeConnectDialog = () => {
    if (status === 'connecting') {
      handleDisconnect()
    } else {
      setShowConnectDialog(false)
      setPairingCode(null)
      setQrCode(null)
    }
  }

  const statusConfig = {
    connected: { 
      icon: Wifi, 
      text: 'Conectado', 
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      badge: 'bg-green-500'
    },
    connecting: { 
      icon: Loader2, 
      text: 'Conectando...', 
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      badge: 'bg-yellow-500'
    },
    disconnected: { 
      icon: WifiOff, 
      text: 'Desconectado', 
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      badge: 'bg-red-500'
    },
  }

  const currentStatus = statusConfig[status]
  const StatusIcon = currentStatus.icon

  const formatPhone = (p?: string) => {
    if (!p) return null
    if (p.startsWith('+')) return p
    return `+${p}`
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    if (!mounted) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:bg-destructive/20 rounded p-1">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Session Profile Card */}
        <Card className="p-5">
          {/* Main Row: Avatar + Info + Actions */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="size-16 border-2 border-background shadow-md">
                <AvatarImage src={profilePicture} />
                <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-primary/20 to-primary/5">
                  {pushName?.[0]?.toUpperCase() || sessionId[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span 
                className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-background ${currentStatus.badge}`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold truncate">{sessionId}</h1>
                <Badge variant="secondary" className={`${currentStatus.color} shrink-0`}>
                  <StatusIcon className={`size-3 mr-1 ${status === 'connecting' ? 'animate-spin' : ''}`} />
                  {currentStatus.text}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {pushName && pushName !== sessionId ? pushName : ''}{pushName && pushName !== sessionId && formatPhone(phone) ? ' · ' : ''}{formatPhone(phone) || ''}
              </p>
              <div className="flex flex-col gap-1 mt-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Key className="size-3" />
                  <code className="bg-muted px-1 py-0.5 rounded font-mono">
                    {showApiKey ? (initialApiKey || '-') : '••••••••••••'}
                  </code>
                  <button onClick={() => setShowApiKey(!showApiKey)} className="hover:text-foreground">
                    {showApiKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </button>
                  <button onClick={() => copyToClipboard(initialApiKey || '', 'apiKey')} className="hover:text-foreground">
                    {copied === 'apiKey' ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  <span>Criado em {formatDate(initialCreatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {status === 'disconnected' && (
                <Button onClick={handleConnect} disabled={loading !== null} size="sm" className="gap-1.5">
                  {loading === 'connect' ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                  Conectar
                </Button>
              )}
              {status === 'connecting' && (
                <>
                  <Button onClick={() => setShowConnectDialog(true)} size="sm" className="gap-1.5">
                    <QrCode className="size-4" />
                    QR Code
                  </Button>
                  <Button variant="outline" onClick={handleDisconnect} disabled={loading !== null} size="sm" className="gap-1.5">
                    {loading === 'disconnect' ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                    Cancelar
                  </Button>
                </>
              )}
              {status === 'connected' && (
                <>
                  <Button variant="outline" onClick={handleRestart} disabled={loading !== null} size="sm" className="gap-1.5">
                    {loading === 'restart' ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    Reiniciar
                  </Button>
                  <Button variant="outline" onClick={handleDisconnect} disabled={loading !== null} size="sm" className="gap-1.5">
                    {loading === 'disconnect' ? <Loader2 className="size-4 animate-spin" /> : <PowerOff className="size-4" />}
                    Desconectar
                  </Button>
                  <Button variant="outline" onClick={() => setShowLogoutDialog(true)} disabled={loading !== null} size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10">
                    <LogOut className="size-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Actions - Mobile */}
          <div className="flex sm:hidden flex-wrap gap-2 mt-4 pt-4 border-t">
            {status === 'disconnected' && (
              <Button onClick={handleConnect} disabled={loading !== null} className="flex-1 gap-1.5">
                {loading === 'connect' ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                Conectar
              </Button>
            )}
            {status === 'connecting' && (
              <>
                <Button onClick={() => setShowConnectDialog(true)} className="flex-1 gap-1.5">
                  <QrCode className="size-4" />
                  QR Code
                </Button>
                <Button variant="outline" onClick={handleDisconnect} disabled={loading !== null} className="gap-1.5">
                  {loading === 'disconnect' ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                  Cancelar
                </Button>
              </>
            )}
            {status === 'connected' && (
              <>
                <Button variant="outline" onClick={handleRestart} disabled={loading !== null} size="sm" className="flex-1 gap-1.5">
                  {loading === 'restart' ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Reiniciar
                </Button>
                <Button variant="outline" onClick={handleDisconnect} disabled={loading !== null} size="sm" className="flex-1 gap-1.5">
                  {loading === 'disconnect' ? <Loader2 className="size-4 animate-spin" /> : <PowerOff className="size-4" />}
                  Desconectar
                </Button>
                <Button variant="outline" onClick={() => setShowLogoutDialog(true)} disabled={loading !== null} size="sm" className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href={`/sessions/${sessionId}/chats`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas</CardTitle>
                <MessageSquare className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.chats ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.messages ? `${stats.messages.toLocaleString()} mensagens` : 'Chats ativos'}
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
                <div className="text-2xl font-bold">{stats?.contacts ?? 0}</div>
                <p className="text-xs text-muted-foreground">Total salvos</p>
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
                <div className="text-2xl font-bold">{stats?.groups ?? 0}</div>
                <p className="text-xs text-muted-foreground">Participando</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/sessions/${sessionId}/integrations/webhooks`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
                <Webhook className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Settings className="size-5" />
                </div>
                <p className="text-xs text-muted-foreground">Configurar eventos</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acesso Rapido</CardTitle>
            <CardDescription>Links uteis para gerenciar esta sessao</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link href={`/sessions/${sessionId}/settings`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Settings className="size-4" />
                  Configuracoes
                </Button>
              </Link>
              <Link href={`/sessions/${sessionId}/integrations/webhooks`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Webhook className="size-4" />
                  Webhooks
                </Button>
              </Link>
              <Link href={`/sessions/${sessionId}/integrations/chatwoot`}>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ExternalLink className="size-4" />
                  Chatwoot
                </Button>
              </Link>
              <a href={`https://api.xapza.com/swagger/index.html`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ExternalLink className="size-4" />
                  API Docs
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={closeConnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escolha como deseja conectar
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={connectMethod} onValueChange={(v) => setConnectMethod(v as 'qr' | 'phone')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="gap-2">
                <QrCode className="size-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Smartphone className="size-4" />
                Codigo
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="qr" className="mt-4">
              <div className="flex flex-col items-center gap-4">
                {qrCode ? (
                  <>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <img 
                        src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                        alt="QR Code"
                        className="size-56"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Abra o WhatsApp → Aparelhos conectados → Escanear
                    </p>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <Loader2 className="size-10 mx-auto mb-3 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="phone" className="mt-4">
              <div className="space-y-4">
                {!pairingCode ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Numero com DDI</label>
                      <Input
                        placeholder="5511999999999"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => e.key === 'Enter' && handlePairPhone()}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handlePairPhone}
                      disabled={loading === 'pair' || !phoneNumber.trim()}
                    >
                      {loading === 'pair' ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Phone className="size-4 mr-2" />
                      )}
                      Gerar Codigo
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">Digite no WhatsApp:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-3xl font-mono font-bold tracking-widest bg-muted px-4 py-3 rounded-lg">
                        {pairingCode}
                      </code>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(pairingCode, 'code')}>
                        {copied === 'code' ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aparelhos conectados → Conectar → Numero de telefone
                    </p>
                    <Button variant="outline" onClick={() => setPairingCode(null)} size="sm">
                      Gerar novo
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="ghost" onClick={closeConnectDialog}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fazer Logout?</DialogTitle>
            <DialogDescription>
              Voce precisara escanear o QR Code novamente para reconectar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setShowLogoutDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLogout} disabled={loading === 'logout'}>
              {loading === 'logout' && <Loader2 className="size-4 mr-2 animate-spin" />}
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
