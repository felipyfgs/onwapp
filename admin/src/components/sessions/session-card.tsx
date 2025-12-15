"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  QrCode, 
  Power, 
  PowerOff, 
  Trash2, 
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { QRCodeDialog } from "./qr-code-dialog"

interface SessionCardProps {
  session: {
    id: string
    name: string
    status: 'connected' | 'disconnected' | 'connecting' | 'qr' | 'loading'
    phone?: string
    profile?: {
      pushname?: string
      picture?: string
    }
    lastConnection?: string
  }
  onSessionUpdate?: () => void
}

export function SessionCard({ session, onSessionUpdate }: SessionCardProps) {
  const router = useRouter()
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const api = useApi()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'disconnected':
        return 'bg-red-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'qr':
        return 'bg-blue-500'
      case 'loading':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'disconnected':
        return 'Desconectado'
      case 'connecting':
        return 'Conectando...'
      case 'qr':
        return 'Aguardando QR Code'
      case 'loading':
        return 'Carregando...'
      default:
        return 'Desconhecido'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />
      case 'disconnected':
        return <XCircle className="h-4 w-4" />
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'qr':
        return <QrCode className="h-4 w-4" />
      case 'loading':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleConnect = async () => {
    setActionLoading('connect')
    try {
      await connectSession(session.id)
      toast.success("Sessão conectada com sucesso!")
      onSessionUpdate?.()
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar sessão")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisconnect = async () => {
    setActionLoading('disconnect')
    try {
      await disconnectSession(session.id)
      toast.success("Sessão desconectada com sucesso!")
      onSessionUpdate?.()
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar sessão")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a sessão ${session.name}?`)) {
      return
    }
    
    setActionLoading('delete')
    try {
      await api.deleteSession(session.id)
      toast.success("Sessão excluída com sucesso!")
      onSessionUpdate?.()
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir sessão")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestart = async () => {
    setActionLoading('restart')
    try {
      await api.restartSession(session.id)
      toast.success("Sessão reiniciada com sucesso!")
      onSessionUpdate?.()
    } catch (error: any) {
      toast.error(error.message || "Erro ao reiniciar sessão")
    } finally {
      setActionLoading(null)
    }
  }

  const showQRCode = () => {
    setQrDialogOpen(true)
  }

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {session.name}
            </CardTitle>
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(session.status)} text-white`}
            >
              <span className="flex items-center gap-1">
                {getStatusIcon(session.status)}
                {getStatusText(session.status)}
              </span>
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {session.profile?.pushname && (
            <div>
              <p className="text-sm font-medium">Nome do Perfil</p>
              <p className="text-sm text-gray-600">{session.profile.pushname}</p>
            </div>
          )}
          
          {session.phone && (
            <div>
              <p className="text-sm font-medium">Telefone</p>
              <p className="text-sm text-gray-600">{session.phone}</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 pt-2">
            {session.status === 'qr' && (
              <Button
                size="sm"
                variant="outline"
                onClick={showQRCode}
                className="flex items-center gap-1"
              >
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
            )}
            
            {session.status === 'disconnected' && (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={actionLoading === 'connect'}
                className="flex items-center gap-1"
              >
                <Power className="h-4 w-4" />
                {actionLoading === 'connect' ? 'Conectando...' : 'Conectar'}
              </Button>
            )}
            
            {session.status === 'connected' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                disabled={actionLoading === 'disconnect'}
                className="flex items-center gap-1"
              >
                <PowerOff className="h-4 w-4" />
                {actionLoading === 'disconnect' ? 'Desconectando...' : 'Desconectar'}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestart}
              disabled={actionLoading === 'restart'}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
              {actionLoading === 'restart' ? 'Reiniciando...' : 'Reiniciar'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/sessions/${session.id}`)}
              className="flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              Detalhes
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              {actionLoading === 'delete' ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        sessionId={session.id}
      />
    </>
  )
}