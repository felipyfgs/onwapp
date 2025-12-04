'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { IconLoader2, IconCheck, IconPlugConnected, IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getSessionQRData, connectSession } from '@/lib/api'

interface QRCodeDialogProps {
  sessionName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected?: () => void
}

export function QRCodeDialog({ sessionName, open, onOpenChange, onConnected }: QRCodeDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const fetchQR = useCallback(async (): Promise<boolean> => {
    if (!sessionName) return false

    try {
      setError(null)
      const data = await getSessionQRData(sessionName)
      setStatus(data.status)
      retryCountRef.current = 0
      
      if (data.status === 'connected') {
        setQrCode(null)
        onConnected?.()
        setTimeout(() => onOpenChange(false), 1500)
        return false
      }
      
      if (data.qr) {
        setQrCode(data.qr)
      }
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar QR code'
      
      // Handle rate limiting
      if (message.includes('429')) {
        retryCountRef.current++
        if (retryCountRef.current < 3) {
          // Wait longer on rate limit
          return true
        }
        setError('Muitas requisicoes. Aguarde alguns segundos...')
      } else {
        setError(message)
      }
      return true
    }
  }, [sessionName, onOpenChange, onConnected])

  const startPolling = useCallback(() => {
    stopPolling()
    
    const poll = async () => {
      const shouldContinue = await fetchQR()
      if (shouldContinue && open) {
        // Increase interval to avoid rate limiting
        const interval = retryCountRef.current > 0 ? 5000 : 3000
        pollingRef.current = setTimeout(poll, interval)
      }
    }

    poll()
  }, [fetchQR, open, stopPolling])

  useEffect(() => {
    if (open && sessionName) {
      setQrCode(null)
      setStatus('')
      setError(null)
      retryCountRef.current = 0
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [open, sessionName, startPolling, stopPolling])

  const handleConnect = async () => {
    if (!sessionName) return
    setLoading(true)
    setError(null)
    try {
      await connectSession(sessionName)
      startPolling()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    retryCountRef.current = 0
    startPolling()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">Conectar Sessao</DialogTitle>
          <DialogDescription className="text-base">
            Escaneie o QR Code abaixo com o WhatsApp no seu celular
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Session Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <span className="text-sm text-muted-foreground">Sessao:</span>
            <code className="font-semibold">{sessionName}</code>
          </div>

          {/* QR Code Area */}
          <div className="relative flex items-center justify-center w-72 h-72 rounded-xl border-2 border-dashed bg-muted/30">
            {status === 'connected' ? (
              <div className="flex flex-col items-center gap-4 text-green-600">
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                  <IconCheck className="h-12 w-12" />
                </div>
                <p className="text-lg font-semibold">Conectado!</p>
              </div>
            ) : status === 'disconnected' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <IconPlugConnected className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center px-4">
                  Clique no botao abaixo para iniciar a conexao
                </p>
                <Button onClick={handleConnect} disabled={loading} size="lg">
                  {loading ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <IconPlugConnected className="mr-2 h-4 w-4" />
                      Iniciar Conexao
                    </>
                  )}
                </Button>
              </div>
            ) : qrCode ? (
              <>
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-64 h-64 rounded-lg"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 rounded-full bg-background border px-3 py-1.5 shadow-sm">
                    <IconLoader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Aguardando leitura...</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="max-w-sm">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={handleRetry} className="ml-2 h-auto p-1">
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          {qrCode && status !== 'connected' && (
            <div className="text-center text-sm text-muted-foreground max-w-xs">
              <p>Abra o WhatsApp no celular, va em <strong>Configuracoes</strong> &gt; <strong>Aparelhos conectados</strong> &gt; <strong>Conectar aparelho</strong></p>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
