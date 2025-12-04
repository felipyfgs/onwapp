'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { IconLoader2, IconCheck, IconPlugConnected, IconAlertCircle, IconRefresh, IconQrcode, IconDeviceMobile } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getSessionQRData, connectSession, pairPhone } from '@/lib/api'

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

  // Pairing code state
  const [activeTab, setActiveTab] = useState<string>('qrcode')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingLoading, setPairingLoading] = useState(false)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const fetchStatus = useCallback(async (): Promise<boolean> => {
    if (!sessionName) return false

    try {
      setError(null)
      const data = await getSessionQRData(sessionName)
      setStatus(data.status)
      retryCountRef.current = 0
      
      if (data.status === 'connected') {
        setQrCode(null)
        setPairingCode(null)
        onConnected?.()
        setTimeout(() => onOpenChange(false), 1500)
        return false
      }
      
      // Only update QR if on QR tab
      if (activeTab === 'qrcode' && data.qr) {
        setQrCode(data.qr)
      }
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar status'
      
      if (message.includes('429')) {
        retryCountRef.current++
        if (retryCountRef.current < 3) {
          return true
        }
        setError('Muitas requisicoes. Aguarde alguns segundos...')
      } else if (!message.includes('404')) {
        setError(message)
      }
      return true
    }
  }, [sessionName, onOpenChange, onConnected, activeTab])

  const startPolling = useCallback((interval: number = 3000) => {
    stopPolling()
    
    const poll = async () => {
      const shouldContinue = await fetchStatus()
      if (shouldContinue && open) {
        const nextInterval = retryCountRef.current > 0 ? 5000 : interval
        pollingRef.current = setTimeout(poll, nextInterval)
      }
    }

    poll()
  }, [fetchStatus, open, stopPolling])

  // Handle tab change - stop polling when switching to paircode tab
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    setError(null)
    
    if (tab === 'qrcode') {
      // Resume QR polling
      startPolling(3000)
    } else {
      // Stop QR polling on paircode tab (unless we have a code and need status check)
      if (!pairingCode) {
        stopPolling()
      }
    }
  }, [startPolling, stopPolling, pairingCode])

  useEffect(() => {
    if (open && sessionName) {
      setQrCode(null)
      setStatus('')
      setError(null)
      setPairingCode(null)
      setPhoneNumber('')
      setActiveTab('qrcode')
      retryCountRef.current = 0
      startPolling(3000)
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [open, sessionName]) // Remove startPolling from deps to avoid loop

  const handleConnect = async () => {
    if (!sessionName) return
    setLoading(true)
    setError(null)
    try {
      await connectSession(sessionName)
      startPolling(3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    retryCountRef.current = 0
    if (activeTab === 'qrcode') {
      startPolling(3000)
    }
  }

  const handlePairPhone = async () => {
    if (!sessionName || !phoneNumber || pairingLoading) return
    
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    if (cleanPhone.length < 7) {
      setError('Numero de telefone muito curto. Use formato internacional (ex: 5511999999999)')
      return
    }
    
    if (cleanPhone.startsWith('0')) {
      setError('Numero nao pode comecar com 0. Use formato internacional (ex: 5511999999999)')
      return
    }

    setPairingLoading(true)
    setError(null)
    setPairingCode(null)
    stopPolling() // Stop any existing polling

    try {
      // First ensure connection is started
      if (status === 'disconnected' || !status) {
        await connectSession(sessionName)
        // Wait for connection to establish and first QR to be generated
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const response = await pairPhone(sessionName, cleanPhone)
      setPairingCode(response.code)
      
      // Start slow polling just to check connection status (every 5 seconds)
      startPolling(5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter codigo de pareamento')
    } finally {
      setPairingLoading(false)
    }
  }

  const renderConnectedState = () => (
    <div className="flex flex-col items-center gap-4 text-green-600">
      <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
        <IconCheck className="h-12 w-12" />
      </div>
      <p className="text-lg font-semibold">Conectado!</p>
    </div>
  )

  const renderDisconnectedState = () => (
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
  )

  const renderQRCode = () => (
    <>
      <img
        src={qrCode!}
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
  )

  const renderLoadingQR = () => (
    <div className="flex flex-col items-center gap-3">
      <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
    </div>
  )

  const renderPairingCodeContent = () => {
    if (status === 'connected') {
      return renderConnectedState()
    }

    if (pairingCode) {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Seu codigo de pareamento:</p>
            <div className="bg-primary/10 rounded-xl px-6 py-4 border-2 border-primary/20">
              <code className="text-3xl font-bold tracking-widest text-primary">
                {pairingCode}
              </code>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-background border px-3 py-1.5 shadow-sm">
            <IconLoader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Aguardando pareamento...</span>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <div className="rounded-full bg-muted p-4">
          <IconDeviceMobile className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="w-full space-y-2">
          <label className="text-sm text-muted-foreground">
            Numero com DDI (ex: 5511999999999)
          </label>
          <Input
            type="tel"
            placeholder="5511999999999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-center text-lg"
          />
        </div>
        <Button 
          onClick={handlePairPhone} 
          disabled={pairingLoading || !phoneNumber} 
          size="lg"
          className="w-full"
        >
          {pairingLoading ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Obtendo codigo...
            </>
          ) : (
            'Obter Codigo'
          )}
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">Conectar Sessao</DialogTitle>
          <DialogDescription className="text-base">
            Escolha como deseja conectar ao WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Session Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <span className="text-sm text-muted-foreground">Sessao:</span>
            <code className="font-semibold">{sessionName}</code>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode" className="gap-2">
                <IconQrcode className="h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="paircode" className="gap-2">
                <IconDeviceMobile className="h-4 w-4" />
                Codigo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qrcode" className="mt-4">
              <div className="relative flex items-center justify-center w-72 h-72 rounded-xl border-2 border-dashed bg-muted/30 mx-auto">
                {status === 'connected' ? (
                  renderConnectedState()
                ) : status === 'disconnected' ? (
                  renderDisconnectedState()
                ) : qrCode ? (
                  renderQRCode()
                ) : (
                  renderLoadingQR()
                )}
              </div>
              
              {qrCode && status !== 'connected' && (
                <div className="text-center text-sm text-muted-foreground max-w-xs mx-auto mt-4">
                  <p>Abra o WhatsApp, va em <strong>Configuracoes</strong> &gt; <strong>Aparelhos conectados</strong> &gt; <strong>Conectar aparelho</strong></p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="paircode" className="mt-4">
              <div className="flex items-center justify-center min-h-[288px] w-full rounded-xl border-2 border-dashed bg-muted/30 p-6">
                {renderPairingCodeContent()}
              </div>
              
              {pairingCode && status !== 'connected' && (
                <div className="text-center text-sm text-muted-foreground max-w-xs mx-auto mt-4">
                  <p>No WhatsApp, va em <strong>Configuracoes</strong> &gt; <strong>Aparelhos conectados</strong> &gt; <strong>Conectar aparelho</strong> &gt; <strong>Vincular com numero</strong></p>
                </div>
              )}
            </TabsContent>
          </Tabs>

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
