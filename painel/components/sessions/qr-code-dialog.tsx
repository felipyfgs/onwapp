"use client"

import * as React from "react"
import Image from "next/image"
import { Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getSessionQR } from "@/lib/actions"
import type { Session, QRResponse } from "@/types"

interface QRCodeDialogProps {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRCodeDialog({ session, open, onOpenChange }: QRCodeDialogProps) {
  const [qrData, setQrData] = React.useState<QRResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchQR = React.useCallback(async () => {
    if (!session) return

    setLoading(true)
    setError(null)
    try {
      const data = await getSessionQR(session.session)
      setQrData(data)
      
      if (data.status === 'connected') {
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar QR code')
    } finally {
      setLoading(false)
    }
  }, [session, onOpenChange])

  React.useEffect(() => {
    if (open && session) {
      fetchQR()
      const interval = setInterval(fetchQR, 5000)
      return () => clearInterval(interval)
    }
  }, [open, session, fetchQR])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR code com seu WhatsApp para conectar a sessao &quot;{session?.session}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          {loading && !qrData?.qr ? (
            <div className="flex h-64 w-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-64 w-64 flex-col items-center justify-center gap-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchQR}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : qrData?.qr ? (
            <div className="relative h-64 w-64 overflow-hidden rounded-lg border bg-white p-2">
              <Image
                src={qrData.qr}
                alt="QR Code"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex h-64 w-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {qrData?.status === 'connected' 
                  ? 'Ja conectado!' 
                  : 'Aguardando QR code...'}
              </p>
            </div>
          )}
          {qrData?.status && (
            <p className="mt-4 text-sm text-muted-foreground">
              Status: {qrData.status}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
