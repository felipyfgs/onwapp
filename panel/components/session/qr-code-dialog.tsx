'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, QrCode, X } from 'lucide-react';
import NextImage from 'next/image';

interface QrCodeDialogProps {
  sessionName: string;
  qrCode?: string;
  pairingCode?: string;
  status?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export function QrCodeDialog({ 
  sessionName, 
  qrCode, 
  pairingCode, 
  status = 'disconnected',
  open, 
  onOpenChange,
  onClose
}: QrCodeDialogProps) {
  const [connectionStatus, setConnectionStatus] = useState(status);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle status changes
  useEffect(() => {
    setConnectionStatus(status);
    
    if (status === 'connected') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onClose?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const handleClose = () => {
    if (connectionStatus === 'connecting') {
      if (!confirm('Tem certeza que deseja fechar? A conexão será interrompida.')) {
        return;
      }
    }
    onOpenChange(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5" />
            <span>Conectar WhatsApp</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {qrCode ? (
            <>              
              <div className="relative w-64 h-64 rounded-lg border-2 bg-white dark:bg-gray-950 p-3">
                <NextImage
                  src={qrCode}
                  alt={`QR Code para ${sessionName}`}
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              
              {pairingCode && (
                <div className="text-center w-full py-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Código de Pareamento</p>
                  <p className="text-2xl font-mono font-bold tracking-widest">{pairingCode}</p>
                </div>
              )}
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Abra o WhatsApp no celular e escaneie o código
                </p>
                <p className="text-xs text-muted-foreground">
                  {sessionName}
                </p>
              </div>
            </>
          ) : connectionStatus === 'connecting' ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              <p className="text-xs text-muted-foreground mt-1">Aguarde um momento...</p>
            </div>
          ) : connectionStatus === 'connected' ? (
            <div className="flex flex-col items-center py-8">
              <div className="rounded-full p-4 bg-green-100 dark:bg-green-950 mb-3">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <p className="font-medium text-green-600">Conectado com sucesso!</p>
              <p className="text-xs text-muted-foreground mt-1">
                {sessionName} está pronto para uso
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div className="rounded-full p-4 bg-red-100 dark:bg-red-950 mb-3">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <p className="font-medium text-red-600">Falha na conexão</p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Não foi possível estabelecer conexão com o WhatsApp
              </p>
            </div>
          )}
        </div>
        
        {connectionStatus === 'connecting' && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClose}
              disabled={connectionStatus === 'connecting'}
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
