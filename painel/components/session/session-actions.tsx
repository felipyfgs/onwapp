"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Power, RefreshCw, LogOut, Loader2, QrCode, Smartphone, Copy, Check } from "lucide-react"
import {
  connectSession,
  disconnectSession,
  restartSession,
  logoutSession,
  getSessionQR,
  pairPhone,
} from "@/lib/api/sessions"

interface SessionActionsProps {
  sessionId: string
  isConnected: boolean
  onAction?: () => void
}

export function SessionActions({ sessionId, isConnected, onAction }: SessionActionsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // QR Code state
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrPolling, setQrPolling] = useState(false)
  
  // Pair Phone state
  const [phone, setPhone] = useState("")
  const [pairCode, setPairCode] = useState<string | null>(null)
  const [pairLoading, setPairLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchQR = useCallback(async () => {
    setQrLoading(true)
    try {
      const data = await getSessionQR(sessionId)
      setQrCode(data.qr || null)
      return data.status
    } catch (error) {
      console.error("Failed to get QR:", error)
      return null
    } finally {
      setQrLoading(false)
    }
  }, [sessionId])

  // Poll for QR code while dialog is open and not connected
  useEffect(() => {
    if (!dialogOpen || isConnected) {
      setQrPolling(false)
      return
    }

    setQrPolling(true)
    fetchQR()

    const interval = setInterval(async () => {
      const status = await fetchQR()
      if (status === "connected") {
        setDialogOpen(false)
        onAction?.()
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      setQrPolling(false)
    }
  }, [dialogOpen, isConnected, fetchQR, onAction])

  // Close dialog when connected
  useEffect(() => {
    if (isConnected && dialogOpen) {
      setDialogOpen(false)
      onAction?.()
    }
  }, [isConnected, dialogOpen, onAction])

  const handleConnect = async () => {
    setActionLoading("connect")
    try {
      await connectSession(sessionId)
      // Open dialog to show QR code after connecting
      setDialogOpen(true)
    } catch (error) {
      console.error("Failed to connect:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisconnect = async () => {
    setActionLoading("disconnect")
    try {
      await disconnectSession(sessionId)
      onAction?.()
    } catch (error) {
      console.error("Failed to disconnect:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestart = async () => {
    setActionLoading("restart")
    try {
      await restartSession(sessionId)
      onAction?.()
    } catch (error) {
      console.error("Failed to restart:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    setActionLoading("logout")
    try {
      await logoutSession(sessionId)
      onAction?.()
    } catch (error) {
      console.error("Failed to logout:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handlePairPhone = async () => {
    if (!phone.trim()) return
    
    setPairLoading(true)
    setPairCode(null)
    try {
      // First connect the session
      await connectSession(sessionId)
      // Then request pair code
      const data = await pairPhone(sessionId, phone.replace(/\D/g, ""))
      setPairCode(data.code)
    } catch (error) {
      console.error("Failed to pair phone:", error)
    } finally {
      setPairLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (pairCode) {
      navigator.clipboard.writeText(pairCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      // Reset state when closing
      setPairCode(null)
      setPhone("")
    }
  }

  return (
    <>
      {isConnected ? (
        <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={actionLoading !== null}>
          {actionLoading === "disconnect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
          <span className="ml-2">Desconectar</span>
        </Button>
      ) : (
        <Button variant="default" size="sm" onClick={handleConnect} disabled={actionLoading !== null}>
          {actionLoading === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
          <span className="ml-2">Conectar</span>
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>Escolha como deseja conectar sua sessão</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="qrcode" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Código
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="qrcode" className="mt-4">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Abra o WhatsApp no seu celular e escaneie o código
                </p>
                <div className="flex items-center justify-center min-h-[256px]">
                  {qrLoading && !qrCode ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Gerando QR Code...</span>
                    </div>
                  ) : qrCode ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="QR Code" className="w-64 h-64 rounded-lg" />
                      {qrPolling && (
                        <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Aguardando leitura...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p>QR Code não disponível</p>
                      <p className="text-sm">Aguarde um momento...</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="phone" className="mt-4">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Digite seu número de telefone para receber um código de pareamento
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Número do telefone</Label>
                  <Input
                    id="phone"
                    placeholder="5511999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={pairLoading || !!pairCode}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o número com código do país (ex: 5511999999999)
                  </p>
                </div>

                {!pairCode ? (
                  <Button onClick={handlePairPhone} disabled={pairLoading || !phone.trim()}>
                    {pairLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Gerando código...
                      </>
                    ) : (
                      "Gerar código"
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
                      <code className="text-2xl font-mono font-bold tracking-wider">{pairCode}</code>
                      <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Digite este código no WhatsApp do seu celular
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => { setPairCode(null); setPhone("") }}>
                      Gerar novo código
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm" onClick={handleRestart} disabled={actionLoading !== null || !isConnected}>
        {actionLoading === "restart" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        <span className="ml-2">Reiniciar</span>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={actionLoading !== null || !isConnected}>
            <LogOut className="h-4 w-4" />
            <span className="ml-2">Logout</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fazer logout da sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá desconectar o WhatsApp deste dispositivo. Você precisará escanear o QR Code novamente para reconectar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Confirmar Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
