"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, RefreshCw } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
}

export function QRCodeDialog({ open, onOpenChange, sessionId }: QRCodeDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const api = useApi()

  useEffect(() => {
    if (open && sessionId) {
      fetchQRCode()
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [open, sessionId])

  const fetchQRCode = async () => {
    setLoading(true)
    try {
      const response = await api.getQRCode(sessionId)
      if (response.qr) {
        setQrCode(response.qr)
        
        // Configurar refresh automático a cada 5 segundos
        if (refreshInterval) {
          clearInterval(refreshInterval)
        }
        const interval = setInterval(fetchQRCode, 5000)
        setRefreshInterval(interval)
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao obter QR Code")
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    fetchQRCode()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - {sessionId}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 w-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : qrCode ? (
            <>
              <div className="border-2 border-gray-200 rounded-lg p-2">
                <img 
                  src={`data:image/png;base64,${qrCode}`}
                  alt="QR Code"
                  className="h-64 w-64"
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Escaneie este QR Code com o WhatsApp para conectar a sessão
              </p>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar QR Code
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 w-64 space-y-2">
              <QrCode className="h-12 w-12 text-gray-400" />
              <p className="text-gray-500 text-center">
                Aguardando QR Code...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}