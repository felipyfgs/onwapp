'use client';

import { useState } from 'react';
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
import { Plus } from 'lucide-react';

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
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
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Erro ao criar sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
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
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
