'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProfileStore } from '@/stores/contact-store';
import apiClient from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ProfileSettings() {
  const params = useParams();
  const sessionId = params.id as string;
  const { profile, setProfile, setLoading } = useProfileStore();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [sessionId]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setStatus(profile.status || '');
    }
  }, [profile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/profile`);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/sessions/${sessionId}/profile/name`, { name });
      alert('Nome atualizado com sucesso!');
      fetchProfile();
    } catch (error) {
      console.error('Failed to update name:', error);
      alert('Erro ao atualizar nome');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/sessions/${sessionId}/profile/status`, { status });
      alert('Status atualizado com sucesso!');
      fetchProfile();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Erro ao atualizar status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Gerencie sua foto de perfil do WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {name?.substring(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" disabled>Alterar Foto</Button>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nome</CardTitle>
          <CardDescription>Atualize seu nome de exibição</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdateName} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Nome'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>Atualize sua mensagem de status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Textarea
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleUpdateStatus} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Status'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
