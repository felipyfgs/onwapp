'use client'

import { useState, useEffect, useCallback } from 'react'
import { MoreHorizontal, Play, Pause, LogOut, RefreshCw, Trash2, QrCode, Phone, Webhook, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Session } from '@/types/session'
import {
  connectSession,
  disconnectSession,
  logoutSession,
  restartSession,
  deleteSession,
  getQRCode,
} from '@/lib/actions/sessions'
import { PairPhoneDialog } from './pair-phone-dialog'
import { WebhookConfigDialog } from './webhook-config-dialog'
import { toast } from 'sonner'

interface SessionActionsProps {
  session: Session
  onUpdate: () => void
}

export function SessionActions({ session, onUpdate }: SessionActionsProps) {
  const [loading, setLoading] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrCountdown, setQrCountdown] = useState(20)
  const [pairPhoneOpen, setPairPhoneOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)

  const refreshQR = useCallback(async () => {
    setQrLoading(true)
    try {
      const data = await getQRCode(session.session)
      setQrCode(data.qr || null)
      setQrCountdown(20)
    } catch {
      setQrCode(null)
    } finally {
      setQrLoading(false)
    }
  }, [session.session])

  useEffect(() => {
    if (!qrDialogOpen) return
    
    refreshQR()
    const refreshInterval = setInterval(refreshQR, 20000)
    const countdownInterval = setInterval(() => {
      setQrCountdown((prev) => (prev > 0 ? prev - 1 : 20))
    }, 1000)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(countdownInterval)
    }
  }, [qrDialogOpen, refreshQR])

  async function handleAction(action: () => Promise<unknown>, successMsg?: string) {
    setLoading(true)
    try {
      await action()
      if (successMsg) toast.success(successMsg)
      onUpdate()
    } catch (error) {
      toast.error('Erro ao executar acao')
      console.error('Action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    await handleAction(() => deleteSession(session.session), 'Sessao deletada!')
    setDeleteAlertOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={loading} className="hover:bg-gray-100">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            <span className="sr-only">Acoes</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {session.status === 'disconnected' && (
            <DropdownMenuItem onClick={() => handleAction(() => connectSession(session.session), 'Conectando sessao...')}>
              <Play className="mr-2 h-4 w-4 text-green-600" />
              Conectar
            </DropdownMenuItem>
          )}

          {session.status === 'connecting' && (
            <>
              <DropdownMenuItem onClick={() => setQrDialogOpen(true)}>
                <QrCode className="mr-2 h-4 w-4 text-blue-600" />
                Ver QR Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPairPhoneOpen(true)}>
                <Phone className="mr-2 h-4 w-4 text-green-600" />
                Parear por Telefone
              </DropdownMenuItem>
            </>
          )}

          {session.status === 'connected' && (
            <>
              <DropdownMenuItem onClick={() => handleAction(() => disconnectSession(session.session), 'Sessao desconectada!')}>
                <Pause className="mr-2 h-4 w-4 text-yellow-600" />
                Desconectar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => restartSession(session.session), 'Sessao reiniciada!')}>
                <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
                Reiniciar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => logoutSession(session.session), 'Logout realizado!')}>
                <LogOut className="mr-2 h-4 w-4 text-orange-600" />
                Logout
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setWebhookOpen(true)}>
            <Webhook className="mr-2 h-4 w-4 text-purple-600" />
            Configurar Webhook
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
            onClick={() => setDeleteAlertOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              QR Code - {session.session}
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrLoading ? (
              <div className="flex items-center justify-center w-[256px] h-[256px] bg-gray-50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : qrCode ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="QR Code" className="max-w-[256px] rounded-lg border border-gray-200" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Atualiza em {qrCountdown}s
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-[256px] h-[256px] bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <QrCode className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">QR Code nao disponivel</p>
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPairPhoneOpen(true)
                  setQrDialogOpen(false)
                }}
              >
                <Phone className="mr-2 h-4 w-4" />
                Parear por Telefone
              </Button>
              <Button variant="outline" onClick={refreshQR} disabled={qrLoading}>
                <RefreshCw className={`h-4 w-4 ${qrLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PairPhoneDialog
        open={pairPhoneOpen}
        onOpenChange={setPairPhoneOpen}
        sessionName={session.session}
        onSuccess={onUpdate}
      />

      <WebhookConfigDialog
        open={webhookOpen}
        onOpenChange={setWebhookOpen}
        sessionName={session.session}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Sessao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a sessao <strong>{session.session}</strong>?
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
