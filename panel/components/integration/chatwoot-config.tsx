'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ChatwootConfig() {
  const params = useParams();
  const sessionId = params.id as string;
  const [config, setConfig] = useState({
    url: '',
    accountId: '',
    token: '',
    enabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [sessionId]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/chatwoot/find`);
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch chatwoot config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/sessions/${sessionId}/chatwoot/set`, config);
      alert('Configuração salva com sucesso!');
      fetchConfig();
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (type: string) => {
    setSaving(true);
    try {
      await apiClient.post(`/sessions/${sessionId}/chatwoot/sync/${type}`);
      alert(`Sincronização de ${type} iniciada!`);
    } catch (error) {
      console.error(`Failed to sync ${type}:`, error);
      alert(`Erro ao sincronizar ${type}`);
    } finally {
      setSaving(false);
    }
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
              <CardTitle>Integração Chatwoot</CardTitle>
              <CardDescription>Configure a integração com o Chatwoot</CardDescription>
            </div>
            <Badge variant={config.enabled ? 'default' : 'secondary'}>
              {config.enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="sync">Sincronização</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL do Chatwoot</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://app.chatwoot.com"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountId">Account ID</Label>
                <Input
                  id="accountId"
                  placeholder="123456"
                  value={config.accountId}
                  onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">API Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="seu-token-aqui"
                  value={config.token}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSync('contacts')}
                  disabled={!config.enabled || saving}
                >
                  Sincronizar Contatos
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSync('messages')}
                  disabled={!config.enabled || saving}
                >
                  Sincronizar Mensagens
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSync('')}
                  disabled={!config.enabled || saving}
                >
                  Sincronizar Tudo
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
