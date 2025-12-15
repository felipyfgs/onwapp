"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, RefreshCw } from "lucide-react"
import { useSessions } from "@/hooks/use-api"
import { toast } from "sonner"
import { QRResponse } from "@/types/session"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
}

export function QRCodeDialog({ open, onOpenChange, sessionId }: QRCodeDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { getSessionQR } = useSessions()

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
    setError(null)
    try {
      const response: QRResponse = await getSessionQR(sessionId)
      if (response.qr) {
        setQrCode(response.qr)
        setError(null)
        
        // Configurar refresh automático a cada 5 segundos
        if (refreshInterval) {
          clearInterval(refreshInterval)
        }
        const interval = setInterval(fetchQRCode, 5000)
        setRefreshInterval(interval)
      } else if (response.code === 'error') {
        // Se não houver QR Code mas houver erro, parar refresh
        if (refreshInterval) {
          clearInterval(refreshInterval)
        }
        setError(response.message || "Erro ao gerar QR Code")
        toast.error(response.message || "Erro ao gerar QR Code")
      }
    } catch (error: unknown) {
      // Parar refresh em caso de erro
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      const errorMessage = error instanceof Error ? error.message : "Erro ao obter QR Code"
      setError(errorMessage)
      toast.error(errorMessage)
      
      // Se o erro for de sessão não conectada, fecha o diálogo
      if (errorMessage.includes('not connected') || errorMessage.includes('session')) {
        onOpenChange(false)
      }
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
            <div className="flex flex-col items-center justify-center h-64 w-64 space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600 text-center">
                Gerando QR Code...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 w-64 space-y-4">
              <div className="text-red-500 text-center">
                <p className="text-sm font-medium">Erro ao gerar QR Code</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          ) : qrCode ? (
            <>
              <div className="border-2 border-gray-200 rounded-lg p-2 bg-white">
                <img 
                  src={`data:image/png;base64,${qrCode}`}
                  alt="QR Code"
                  className="h-64 w-64"
                />
              </div>
              <div className="space-y-2 w-full">
                <p className="text-sm text-gray-600 text-center">
                  Escaneie este QR Code com o WhatsApp para conectar a sessão
                </p>
                <div className="text-xs text-gray-500 text-center">
                  O QR Code é atualizado automaticamente a cada 5 segundos
                </div>
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar Agora
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 w-64 space-y-2">
              <QrCode className="h-12 w-12 text-gray-400" />
              <p className="text-gray-500 text-center">
                Aguardando QR Code...
              </p>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Verificar Novamente
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}