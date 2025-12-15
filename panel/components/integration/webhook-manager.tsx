'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const AVAILABLE_EVENTS = [
  'message',
  'message.send',
  'message.received',
  'qr',
  'connected',
  'disconnected',
  'ready',
];

export function WebhookManager() {
  const params = useParams();
  const sessionId = params.id as string;
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWebhook();
  }, [sessionId]);

  const fetchWebhook = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/webhooks`);
      if (response.data) {
        setUrl(response.data.url || '');
        setEvents(response.data.events || []);
        setEnabled(response.data.enabled || false);
      }
    } catch (error) {
      console.error('Failed to fetch webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/sessions/${sessionId}/webhooks`, {
        url,
        events,
        enabled,
      });
      alert('Webhook configurado com sucesso!');
    } catch (error) {
      console.error('Failed to save webhook:', error);
      alert('Erro ao configurar webhook');
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuração do Webhook</CardTitle>
              <CardDescription>Configure o webhook para receber eventos</CardDescription>
            </div>
            <Badge variant={enabled ? 'default' : 'secondary'}>
              {enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL do Webhook</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://seu-servidor.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Eventos</Label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_EVENTS.map((event) => (
                <div key={event} className="flex items-center space-x-2">
                  <Checkbox
                    id={event}
                    checked={events.includes(event)}
                    onCheckedChange={() => toggleEvent(event)}
                  />
                  <label
                    htmlFor={event}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {event}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked as boolean)}
            />
            <label
              htmlFor="enabled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ativar webhook
            </label>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
