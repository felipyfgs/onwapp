'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGroupStore } from '@/stores/group-store';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

export function CreateGroupDialog() {
  const params = useParams();
  const sessionId = params.id as string;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [participants, setParticipants] = useState('');
  const [loading, setLoading] = useState(false);
  const addGroup = useGroupStore((state) => state.addGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !participants.trim()) return;

    setLoading(true);
    try {
      const participantList = participants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const response = await apiClient.post(`/sessions/${sessionId}/group/create`, {
        name: name.trim(),
        subject: subject.trim() || name.trim(),
        participants: participantList,
      });

      if (response.data) {
        addGroup(response.data);
      }

      setName('');
      setSubject('');
      setParticipants('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Erro ao criar grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Criar Grupo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
            <DialogDescription>
              Preencha os dados do grupo e adicione participantes
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                placeholder="Meu Grupo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Assunto (opcional)</Label>
              <Input
                id="subject"
                placeholder="Descrição do grupo"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="participants">Participantes</Label>
              <Textarea
                id="participants"
                placeholder="5511999999999, 5511888888888"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Separe os números com vírgula (formato: código do país + DDD + número)
              </p>
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
