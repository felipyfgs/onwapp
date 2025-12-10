"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
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
        <DialogContent className="sm:max-w-[420px] p-0 gap-0">
          <div className="p-4 pb-0">
            <DialogTitle className="text-base font-semibold">Conectar WhatsApp</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Vincule seu WhatsApp a esta sessão</p>
          </div>
          
          <Tabs defaultValue="qrcode" className="w-full p-4">
            <TabsList className="w-full h-9 mb-4">
              <TabsTrigger value="qrcode" className="flex-1 text-xs">
                <QrCode className="h-3.5 w-3.5 mr-1.5" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex-1 text-xs">
                <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                Código
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="qrcode" className="m-0">
              <div className="rounded-lg border border-border p-4">
                <div className="flex flex-col items-center">
                  {qrLoading && !qrCode ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                    </div>
                  ) : qrCode ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-3 bg-white rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCode} alt="QR Code" className="w-56 h-56" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Escaneie com o WhatsApp do celular
                        </p>
                        {qrPolling && (
                          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-primary">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Aguardando leitura...
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <QrCode className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm">Aguarde...</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="phone" className="m-0">
              <div className="rounded-lg border border-border p-4">
                {!pairCode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Número com DDI</Label>
                      <Input
                        id="phone"
                        placeholder="5511999999999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={pairLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Ex: 5511999999999 (Brasil)
                      </p>
                    </div>
                    <Button 
                      onClick={handlePairPhone} 
                      disabled={pairLoading || !phone.trim()}
                      className="w-full"
                    >
                      {pairLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Gerar código"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Digite este código no WhatsApp do celular
                    </p>
                    <div className="w-full p-4 bg-muted rounded-lg text-center">
                      <code className="text-2xl font-mono font-bold tracking-[0.2em]">{pairCode}</code>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyCode}>
                        {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                        {copied ? "Copiado!" : "Copiar"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setPairCode(null); setPhone("") }}
                      >
                        Gerar novo
                      </Button>
                    </div>
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
