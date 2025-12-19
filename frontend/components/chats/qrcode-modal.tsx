"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { RefreshCw, Smartphone, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface QRCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrCodeData?: string
  onRefresh?: () => void
  isLoading?: boolean
  expiresIn?: number
}

export function QRCodeModal({
  open,
  onOpenChange,
  qrCodeData,
  onRefresh,
  isLoading = false,
  expiresIn = 60
}: QRCodeModalProps) {
  const [timeLeft, setTimeLeft] = useState(expiresIn)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setTimeLeft(expiresIn)
  }, [expiresIn])

  const startTimer = useCallback(() => {
    resetTimer()
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [resetTimer])

  useEffect(() => {
    if (open && qrCodeData && !isLoading) {
      if (!initializedRef.current) {
        initializedRef.current = true
        startTimer()
      }
    } else {
      initializedRef.current = false
      resetTimer()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [open, qrCodeData, isLoading, startTimer, resetTimer])

  function handleRefresh() {
    resetTimer()
    startTimer()
    onRefresh?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escaneie o QR Code com seu WhatsApp para conectar
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="bg-background p-4 rounded-lg border border-border">
            {isLoading ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
            ) : qrCodeData ? (
              <img 
                src={qrCodeData} 
                alt="QR Code para conexão WhatsApp" 
                className="w-64 h-64 object-contain"
              />
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <QrCode className="h-12 w-12" />
                <p className="text-sm text-center">
                  Clique em &quot;Gerar QR Code&quot; para iniciar
                </p>
              </div>
            )}
          </div>
          
          {qrCodeData && !isLoading && (
            <div className="flex items-center gap-2 text-sm">
              {timeLeft > 0 ? (
                <p className="text-muted-foreground">
                  Expira em <span className="text-foreground font-medium">{timeLeft}s</span>
                </p>
              ) : (
                <p className="text-destructive">
                  QR Code expirado
                </p>
              )}
            </div>
          )}
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              1. Abra o WhatsApp no seu celular
            </p>
            <p className="text-sm text-muted-foreground">
              2. Toque em <span className="text-foreground">Menu</span> ou <span className="text-foreground">Configurações</span>
            </p>
            <p className="text-sm text-muted-foreground">
              3. Toque em <span className="text-foreground">Dispositivos Conectados</span>
            </p>
            <p className="text-sm text-muted-foreground">
              4. Aponte seu celular para esta tela
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          {onRefresh && (
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {qrCodeData ? 'Atualizar QR Code' : 'Gerar QR Code'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
