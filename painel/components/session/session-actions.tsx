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
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Conectar WhatsApp</DialogTitle>
          
          {/* Header */}
          <div className="p-6 pb-4 text-center border-b border-border">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Conectar WhatsApp</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vincule seu WhatsApp a esta sessão
            </p>
          </div>

          <Tabs defaultValue="qrcode" className="w-full">
            <TabsList className="w-full h-11 rounded-none bg-muted/50 p-1 mx-0">
              <TabsTrigger 
                value="qrcode" 
                className="flex-1 h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger 
                value="phone" 
                className="flex-1 h-full rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Código
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="qrcode" className="m-0 p-6">
              <div className="flex flex-col items-center">
                {qrLoading && !qrCode ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Gerando QR Code</p>
                      <p className="text-sm text-muted-foreground">Aguarde um momento...</p>
                    </div>
                  </div>
                ) : qrCode ? (
                  <div className="flex flex-col items-center gap-5">
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="QR Code" className="w-52 h-52" />
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="space-y-1">
                        <p className="font-medium">Escaneie o código</p>
                        <p className="text-sm text-muted-foreground">
                          Abra o WhatsApp no celular e escaneie
                        </p>
                      </div>
                      
                      {qrPolling && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                          Aguardando leitura...
                        </div>
                      )}
                    </div>

                    <div className="w-full pt-4 border-t border-border">
                      <div className="flex items-start gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0">1</div>
                        <p>Abra o WhatsApp no seu celular</p>
                      </div>
                      <div className="flex items-start gap-3 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0">2</div>
                        <p>Toque em Menu ou Configurações e selecione Aparelhos conectados</p>
                      </div>
                      <div className="flex items-start gap-3 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0">3</div>
                        <p>Toque em Conectar um aparelho e aponte seu celular para esta tela</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <QrCode className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">Preparando...</p>
                    <p className="text-sm">O QR Code será exibido em instantes</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="phone" className="m-0 p-6">
              {!pairCode ? (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Digite seu número para receber um código de 8 dígitos
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Número com código do país</Label>
                    <Input
                      id="phone"
                      placeholder="5511999999999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={pairLoading}
                      className="h-12 text-base text-center tracking-wider"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Exemplo: 55 11 99999-9999
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handlePairPhone} 
                    disabled={pairLoading || !phone.trim()}
                    className="w-full h-12"
                  >
                    {pairLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Gerando...
                      </>
                    ) : (
                      "Gerar código de pareamento"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Digite este código no WhatsApp do seu celular
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 px-6 py-4 bg-muted rounded-2xl">
                    <code className="text-3xl font-mono font-bold tracking-[0.3em]">{pairCode}</code>
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={handleCopyCode}>
                      {copied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>

                  <div className="w-full pt-4 border-t border-border">
                    <div className="flex items-start gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0">1</div>
                      <p>Abra o WhatsApp no seu celular</p>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0">2</div>
                      <p>Vá em Configurações → Aparelhos conectados → Conectar aparelho</p>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold shrink-0">3</div>
                      <p>Toque em &quot;Conectar com número de telefone&quot; e digite o código</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setPairCode(null); setPhone("") }}
                  >
                    Gerar novo código
                  </Button>
                </div>
              )}
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
