"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getQRCode, pairPhone, connectSession, getSessionStatus } from "@/lib/api/sessions"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle, 
  QrCode, 
  Smartphone, 
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface QRCodeDialogProps {
  session: string
  open: boolean
  onClose: () => void
  onConnected?: () => void
}

export function QRCodeDialog({ session, open, onClose, onConnected }: QRCodeDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("disconnected")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pair phone states
  const [phone, setPhone] = useState("")
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingLoading, setPairingLoading] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const fetchQR = useCallback(async () => {
    if (!session) return
    
    try {
      setError(null)
      const response = await getQRCode(session)
      setQrCode(response.qr || null)
      setStatus(response.status)
      setLoading(false)

      if (response.status === "connected") {
        toast.success("Sessão conectada com sucesso!")
        onConnected?.()
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (err: any) {
      console.error("Failed to fetch QR code:", err)
      setError(err.message || "Erro ao buscar QR Code")
      setLoading(false)
    }
  }, [session, onClose, onConnected])

  const startConnection = useCallback(async () => {
    if (!session) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await connectSession(session)
      setStatus(response.status)
      
      if (response.status === "connected") {
        toast.success("Sessão já está conectada!")
        onConnected?.()
        setTimeout(() => onClose(), 1500)
      } else {
        // Buscar QR Code
        await fetchQR()
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar sessão")
      setLoading(false)
    }
  }, [session, fetchQR, onClose, onConnected])

  useEffect(() => {
    if (!session || !open) {
      setQrCode(null)
      setStatus("disconnected")
      setLoading(true)
      setError(null)
      setPairingCode(null)
      setPhone("")
      return
    }

    // Iniciar conexão
    startConnection()

    // Polling para atualizar QR Code e status (reduced frequency to avoid rate limits)
    const interval = setInterval(async () => {
      if (status !== "connected") {
        try {
          const sessionStatus = await getSessionStatus(session)
          if (sessionStatus.status === "connected") {
            setStatus("connected")
            toast.success("Sessão conectada com sucesso!")
            onConnected?.()
            setTimeout(() => onClose(), 1500)
          } else if (status === "connecting") {
            await fetchQR()
          }
        } catch (err: any) {
          // Stop polling on rate limit errors
          if (err?.message?.includes("Limite") || err?.message?.includes("rate limit")) {
            console.warn("Rate limit reached, stopping QR polling")
            clearInterval(interval)
          }
          // Ignore other polling errors
        }
      }
    }, 5000) // Increased from 3s to 5s

    return () => clearInterval(interval)
  }, [session, open, status, startConnection, fetchQR, onClose, onConnected])

  const handlePairPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    setPairingLoading(true)
    setError(null)
    
    try {
      // Primeiro, inicia a conexão
      await connectSession(session)
      
      // Depois, solicita o código de pareamento
      const response = await pairPhone(session, phone.replace(/\D/g, ""))
      setPairingCode(response.code)
      toast.success("Código de pareamento gerado!")
    } catch (err: any) {
      setError(err.message || "Erro ao gerar código de pareamento")
    } finally {
      setPairingLoading(false)
    }
  }

  const copyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode)
      setCodeCopied(true)
      toast.success("Código copiado!")
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const refreshQR = () => {
    setLoading(true)
    setQrCode(null)
    fetchQR()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Smartphone className="h-4 w-4" />
            </div>
            Conectar Sessão
          </DialogTitle>
          <DialogDescription>
            Conecte a sessão <span className="font-medium text-foreground">{session}</span> ao WhatsApp
          </DialogDescription>
        </DialogHeader>

        {/* Connected State */}
        {status === "connected" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-emerald-600">Conectado com sucesso!</p>
            <p className="text-sm text-muted-foreground mt-1">A sessão está pronta para uso</p>
          </div>
        )}

        {/* Connecting State */}
        {status !== "connected" && (
          <Tabs defaultValue="qrcode" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode" className="gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Número
              </TabsTrigger>
            </TabsList>

            {/* QR Code Tab */}
            <TabsContent value="qrcode" className="mt-4">
              <div className="flex flex-col items-center justify-center">
                {loading && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Skeleton className="h-64 w-64 rounded-lg" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando QR Code...
                    </div>
                  </div>
                )}

                {error && !loading && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                      <AlertCircle className="h-8 w-8 text-rose-600" />
                    </div>
                    <p className="text-sm text-center text-rose-600">{error}</p>
                    <Button variant="outline" onClick={refreshQR} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Tentar Novamente
                    </Button>
                  </div>
                )}

                {!loading && !error && qrCode && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl blur-xl" />
                      <div className="relative bg-white p-3 rounded-xl shadow-lg">
                        <img 
                          src={qrCode} 
                          alt="QR Code" 
                          className="h-56 w-56"
                        />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium">Escaneie com o WhatsApp</p>
                      <p className="text-xs text-muted-foreground">
                        Abra o WhatsApp → Menu → Dispositivos Conectados → Conectar
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={refreshQR} className="gap-2">
                      <RefreshCw className="h-3 w-3" />
                      Atualizar QR Code
                    </Button>
                  </div>
                )}

                {!loading && !error && !qrCode && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <QrCode className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">QR Code não disponível</p>
                    <Button variant="outline" onClick={startConnection} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Gerar QR Code
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Phone Number Tab */}
            <TabsContent value="phone" className="mt-4">
              <form onSubmit={handlePairPhone} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Número do WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="5511999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={pairingLoading || !!pairingCode}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o número com código do país (ex: 55 para Brasil)
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {pairingCode ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-2">Código de Pareamento</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-mono font-bold tracking-wider text-emerald-600">
                          {pairingCode}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={copyCode}
                          className="h-8 w-8"
                        >
                          {codeCopied ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium">Digite o código no WhatsApp</p>
                      <p className="text-xs text-muted-foreground">
                        Abra o WhatsApp → Menu → Dispositivos Conectados → Conectar → Conectar com número
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPairingCode(null)
                        setPhone("")
                        setError(null)
                      }}
                    >
                      Gerar Novo Código
                    </Button>
                  </div>
                ) : (
                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={pairingLoading || !phone.trim()}
                  >
                    {pairingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando código...
                      </>
                    ) : (
                      <>
                        <Smartphone className="mr-2 h-4 w-4" />
                        Gerar Código de Pareamento
                      </>
                    )}
                  </Button>
                )}
              </form>
            </TabsContent>
          </Tabs>
        )}

        {/* Status indicator */}
        {status !== "connected" && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t">
            <span className={cn(
              "h-2 w-2 rounded-full",
              status === "connecting" && "bg-amber-500 animate-pulse",
              status === "disconnected" && "bg-rose-500"
            )} />
            <span className="text-xs text-muted-foreground capitalize">
              {status === "connecting" ? "Aguardando conexão..." : "Desconectado"}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
