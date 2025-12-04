'use client'

import { use, useEffect, useState, useCallback } from 'react'
import {
  IconRefresh,
  IconPower,
  IconQrcode,
  IconLogout,
  IconLoader2,
  IconUsers,
  IconUsersGroup,
  IconMessage,
  IconPhoto,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  getSessionStatus,
  connectSession,
  disconnectSession,
  restartSession,
  logoutSession,
  getProfile,
  getContacts,
  getGroups,
  type Profile,
} from '@/lib/api'
import { QRCodeDialog } from '@/components/qrcode-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface SessionInfo {
  status: string
  phone?: string
  version?: string
}

interface Stats {
  contacts: number
  groups: number
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = use(params)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ contacts: 0, groups: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [statusData, profileData, contactsData, groupsData] = await Promise.all([
        getSessionStatus(name),
        getProfile(name).catch(() => ({ profile: null })),
        getContacts(name).catch(() => []),
        getGroups(name).catch(() => ({ data: [] })),
      ])
      setSession({
        status: statusData.status,
        version: statusData.version,
      })
      setProfile(profileData.profile)
      setStats({
        contacts: contactsData?.length || 0,
        groups: groupsData?.data?.length || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessao')
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const handleConnect = async () => {
    try {
      setActionLoading('connect')
      await connectSession(name)
      setSession((prev) => prev ? { ...prev, status: 'connecting' } : null)
      setShowQRDialog(true)
      setTimeout(fetchSession, 2000)
    } catch (err) {
      toast.error('Erro ao conectar')
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisconnect = async () => {
    try {
      setActionLoading('disconnect')
      await disconnectSession(name)
      setSession((prev) => prev ? { ...prev, status: 'disconnected' } : null)
      toast.success('Sessao desconectada')
    } catch (err) {
      toast.error('Erro ao desconectar')
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestart = async () => {
    try {
      setActionLoading('restart')
      await restartSession(name)
      toast.success('Sessao reiniciada')
      setTimeout(fetchSession, 2000)
    } catch (err) {
      toast.error('Erro ao reiniciar')
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    try {
      setActionLoading('logout')
      await logoutSession(name)
      setSession((prev) => prev ? { ...prev, status: 'disconnected' } : null)
      setShowLogoutDialog(false)
      toast.success('Logout realizado')
    } catch (err) {
      toast.error('Erro ao fazer logout')
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const statusColor = {
    connected: 'default',
    disconnected: 'destructive',
    connecting: 'secondary',
    qr_pending: 'secondary',
  } as const

  const statusLabel = {
    connected: 'Conectado',
    disconnected: 'Desconectado',
    connecting: 'Conectando...',
    qr_pending: 'Aguardando QR',
  } as const

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchSession} variant="outline">
          <IconRefresh className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com perfil e acoes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile?.pictureUrl} />
            <AvatarFallback className="text-lg">
              {profile?.name?.charAt(0) || name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">{profile?.name || name}</h2>
              <Badge variant={statusColor[session?.status as keyof typeof statusColor] || 'secondary'}>
                {statusLabel[session?.status as keyof typeof statusLabel] || session?.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {profile?.jid?.split('@')[0] || 'Sessao WhatsApp'}
            </p>
          </div>
        </div>
        <Button onClick={fetchSession} variant="outline" size="sm">
          <IconRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Acoes da sessao */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Controle da Sessao</CardTitle>
          <CardDescription>Gerencie a conexao do WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {session?.status === 'disconnected' || session?.status === 'qr_pending' ? (
              <Button onClick={handleConnect} disabled={actionLoading !== null}>
                {actionLoading === 'connect' ? (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <IconPower className="mr-2 h-4 w-4" />
                )}
                Conectar
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleDisconnect} disabled={actionLoading !== null}>
                {actionLoading === 'disconnect' ? (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <IconPower className="mr-2 h-4 w-4" />
                )}
                Desconectar
              </Button>
            )}

            <Button variant="outline" onClick={() => setShowQRDialog(true)}>
              <IconQrcode className="mr-2 h-4 w-4" />
              QR Code
            </Button>

            <Button variant="outline" onClick={handleRestart} disabled={actionLoading !== null}>
              {actionLoading === 'restart' ? (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <IconRefresh className="mr-2 h-4 w-4" />
              )}
              Reiniciar
            </Button>

            <Button variant="destructive" onClick={() => setShowLogoutDialog(true)} disabled={actionLoading !== null}>
              <IconLogout className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Contatos</CardDescription>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Grupos</CardDescription>
            <IconUsersGroup className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.groups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Mensagens</CardDescription>
            <IconMessage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Midia</CardDescription>
            <IconPhoto className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>

      {/* Info adicional */}
      {session?.status === 'connected' && profile?.status && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status do WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{profile.status}</p>
          </CardContent>
        </Card>
      )}

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fazer logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso ira desconectar o dispositivo do WhatsApp. Voce precisara escanear o QR code novamente para reconectar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground">
              {actionLoading === 'logout' ? (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <QRCodeDialog
        sessionName={name}
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
      />
    </div>
  )
}
