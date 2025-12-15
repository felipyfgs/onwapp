'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, QrCode, X, Phone, Code } from 'lucide-react';
import NextImage from 'next/image';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import apiClient from '@/lib/api';

interface QrCodeDialogProps {
  sessionName: string;
  qrCode?: string;
  status?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export function QrCodeDialog({ 
  sessionName, 
  qrCode, 
  status = 'disconnected',
  open, 
  onOpenChange,
  onClose
}: QrCodeDialogProps) {
  const [connectionStatus, setConnectionStatus] = useState(status);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('qr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [pairingError, setPairingError] = useState('');

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

  const handlePairPhone = async () => {
    if (!phoneNumber) {
      setPairingError('Por favor, insira um número de telefone');
      return;
    }

    setIsPairing(true);
    setPairingError('');
    setPairingCode('');

    try {
      const response = await apiClient.post(`/sessions/${sessionName}/pairphone`, {
        phone: phoneNumber
      });
      
      if (response.data.code) {
        setPairingCode(response.data.code);
      }
    } catch (error) {
      console.error('Failed to pair phone:', error);
      setPairingError('Falha ao gerar código de emparelhamento. Verifique o número e tente novamente.');
    } finally {
      setIsPairing(false);
    }
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="grid grid-cols-2 mb-4">
    <TabsTrigger value="qr">
      <QrCode className="h-4 w-4 mr-2" />
      QR Code
    </TabsTrigger>
    <TabsTrigger value="phone">
      <Phone className="h-4 w-4 mr-2" />
      Código Telefone
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="qr">
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
  </TabsContent>
  
  <TabsContent value="phone">
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="phone-number">Número de Telefone</Label>
        <div className="flex items-center gap-2">
          <Input
            id="phone-number"
            type="tel"
            placeholder="5511999999999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handlePairPhone}
            disabled={isPairing}
            className="shrink-0"
          >
            {isPairing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <Code className="h-4 w-4 mr-2" />
                Gerar Código
              </>
            )}
          </Button>
        </div>
        {pairingError && (
          <p className="text-sm text-red-500 mt-1">{pairingError}</p>
        )}
      </div>
      
      {pairingCode && (
        <div className="space-y-2">
          <Label>Código de Emparelhamento</Label>
          <div className="flex items-center gap-2">
            <Input
              value={pairingCode}
              readOnly
              className="flex-1 font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(pairingCode)}
              className="shrink-0"
            >
              Copiar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Insira este código no WhatsApp para emparelhar
          </p>
        </div>
      )}
    </div>
  </TabsContent>
</Tabs>
        
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
