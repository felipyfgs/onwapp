'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/stores/session-store';
import apiClient from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, QrCode } from 'lucide-react';
import { QrCodeDialog } from './qr-code-dialog';

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const addSession = useSessionStore((state) => state.addSession);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Backend expects 'session' key, not 'name'
      const response = await apiClient.post('/sessions', { session: name.trim() });
      addSession(response.data);
      setName('');
      setOpen(false);
      
      // Open QR code dialog after session creation
      setQrDialogOpen(true);
      setConnectionStatus('connecting');
      
      // Start polling for QR code
      await fetchQrCode(name.trim());
      
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Erro ao criar sessão');
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async (sessionName: string) => {
    try {
      const response = await apiClient.get(`/sessions/${sessionName}/status`);
      
      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
        setPairingCode(response.data.pairingCode || null);
        setConnectionStatus(response.data.status || 'connecting');
      } else if (response.data.status === 'connected') {
        setConnectionStatus('connected');
      } else {
        setTimeout(() => fetchQrCode(sessionName), 2000);
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleQrDialogClose = () => {
    setQrDialogOpen(false);
    setQrCode(null);
    setPairingCode(null);
    setConnectionStatus('disconnected');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Sessão</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Criar Nova Sessão</DialogTitle>
              <DialogDescription>
                Digite um nome único para identificar esta instância do WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Sessão</Label>
                <Input
                  id="name"
                  placeholder="minha-sessao"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar e Conectar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Dialog */}
      <QrCodeDialog
        sessionName={name}
        qrCode={qrCode || undefined}
        pairingCode={pairingCode || undefined}
        status={connectionStatus}
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        onClose={handleQrDialogClose}
      />
    </>
  );
}
