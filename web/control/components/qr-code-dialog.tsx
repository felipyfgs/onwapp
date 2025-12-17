"use client"

import { useEffect, useState, useCallback } from "react"
import { QrCode, Smartphone, RefreshCw, CheckCircle, XCircle } from "lucide-react"

import { getQRCode, pairPhone, getSession } from "@/lib/api/sessions"
import { useAdminWebSocket, ConnectionState } from "@/hooks/use-admin-websocket"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface QRCodeDialogProps {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected?: () => void
}

export function QRCodeDialog({
  sessionId,
  open,
  onOpenChange,
  onConnected,
}: QRCodeDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"waiting" | "connected" | "failed">("waiting")
  const [phone, setPhone] = useState("")
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingLoading, setPairingLoading] = useState(false)

  const handleQRReceived = useCallback((qrBase64: string) => {
    setQrCode(qrBase64)
    setLoading(false)
    setError(null)
    setStatus("waiting")
  }, [])

  const handleConnected = useCallback(() => {
    setStatus("connected")
    onConnected?.()
    setTimeout(() => onOpenChange(false), 1500)
  }, [onConnected, onOpenChange])

  const handleDisconnected = useCallback((_session: string, reason?: string) => {
    if (reason) {
      setError(reason)
    }
    setStatus("failed")
  }, [])

  const handleWsError = useCallback((errorMsg: string) => {
    console.error("WebSocket error:", errorMsg)
  }, [])

  const { connectionState } = useAdminWebSocket({
    sessionFilter: open ? sessionId : undefined,
    onQR: handleQRReceived,
    onConnected: handleConnected,
    onDisconnected: handleDisconnected,
    onError: handleWsError,
    autoReconnect: true,
  })

  const fetchQRCode = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getQRCode(sessionId)
      if (response.success && response.data) {
        setQrCode(response.data.qr)
        setStatus("waiting")
      } else {
        setError(response.error || "Failed to get QR code")
      }
    } catch (err) {
      setError("Failed to get QR code")
      console.error("Failed to get QR code:", err)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const checkStatus = useCallback(async () => {
    const response = await getSession(sessionId)
    if (response.success && response.data?.status === "connected") {
      setStatus("connected")
      onConnected?.()
      setTimeout(() => onOpenChange(false), 1500)
    }
  }, [sessionId, onConnected, onOpenChange])

  useEffect(() => {
    if (open) {
      setLoading(true)
      const fetchData = async () => {
        await fetchQRCode()
      }
      fetchData()
      const interval = connectionState !== "connected" ? setInterval(checkStatus, 3000) : null
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [open, fetchQRCode, checkStatus])

  async function handlePairPhone() {
    if (!phone.trim()) return
    setPairingLoading(true)
    setPairingCode(null)
    const response = await pairPhone(sessionId, { phone: phone.trim() })
    if (response.success && response.data) {
      setPairingCode(response.data.code)
    } else {
      setError(response.error || "Failed to get pairing code")
    }
    setPairingLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Connect WhatsApp</DialogTitle>
          </div>
          <DialogDescription>
            Scan the QR code with your phone or use a pairing code
          </DialogDescription>
        </DialogHeader>

        {status === "connected" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium">Connected!</p>
          </div>
        ) : (
          <Tabs defaultValue="qrcode" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode">
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Smartphone className="mr-2 h-4 w-4" />
                Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qrcode" className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-4">
                {loading ? (
                  <div className="flex h-64 w-64 items-center justify-center rounded-lg border p-4">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : error ? (
                  <div className="flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-lg border">
                    <XCircle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchQRCode}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                ) : qrCode ? (
                  <div className="rounded-lg border bg-white p-4">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="h-56 w-56"
                    />
                  </div>
                ) : null}
                <Button variant="outline" size="sm" onClick={fetchQRCode} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh QR Code
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="phone" className="space-y-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+55 11 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number with country code
                  </p>
                </div>
                <Button
                  onClick={handlePairPhone}
                  disabled={pairingLoading || !phone.trim()}
                  className="w-full"
                >
                  {pairingLoading ? "Getting code..." : "Get Pairing Code"}
                </Button>
                {pairingCode && (
                  <div className="rounded-lg border bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">Your pairing code:</p>
                    <p className="mt-2 text-2xl font-mono font-bold tracking-widest">
                      {pairingCode}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Enter this code in WhatsApp on your phone
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
