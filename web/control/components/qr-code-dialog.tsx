"use client"

import { useEffect, useState, useCallback } from "react"
import { QrCode, Smartphone, RefreshCw, CheckCircle, XCircle } from "lucide-react"

import { getQRCode, pairPhone, getSession } from "@/lib/api/sessions"
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

  const fetchQRCode = useCallback(async () => {
    setLoading(true)
    setError(null)
    const response = await getQRCode(sessionId)
    if (response.success && response.data) {
      setQrCode(response.data.qr)
      setStatus("waiting")
    } else {
      setError(response.error || "Failed to get QR code")
    }
    setLoading(false)
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
      fetchQRCode()
      const interval = setInterval(checkStatus, 3000)
      return () => clearInterval(interval)
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
          <DialogTitle>Connect WhatsApp</DialogTitle>
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
                  <div className="flex h-64 w-64 items-center justify-center rounded-lg border">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
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
