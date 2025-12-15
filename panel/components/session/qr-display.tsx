'use client';

import { useActiveSessionStore } from '@/stores/active-session-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, QrCode } from 'lucide-react';
import Image from 'next/image';

export function QRDisplay() {
  const { qrCode, pairingCode, status } = useActiveSessionStore();

  if (status === 'connected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conectado</CardTitle>
          <CardDescription>Sua sessão está conectada ao WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-green-600">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <QrCode className="h-8 w-8" />
              </div>
              <p className="font-semibold">Sessão Ativa</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'connecting' && !qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conectando</CardTitle>
          <CardDescription>Aguardando QR Code...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escanear QR Code</CardTitle>
          <CardDescription>
            Abra o WhatsApp no seu celular e escaneie o código abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative h-64 w-64 rounded-lg border bg-white p-4">
              <Image
                src={qrCode}
                alt="QR Code"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            {pairingCode && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ou use o código:</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{pairingCode}</p>
              </div>
            )}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>1. Abra o WhatsApp no seu celular</p>
              <p>2. Toque em Menu ou Configurações e selecione Aparelhos conectados</p>
              <p>3. Toque em Conectar um aparelho</p>
              <p>4. Aponte seu celular para esta tela para escanear o código</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desconectado</CardTitle>
        <CardDescription>Clique em &quot;Conectar&quot; para iniciar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <QrCode className="mx-auto mb-4 h-16 w-16" />
            <p>Aguardando conexão</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
