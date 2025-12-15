'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Power, PowerOff, RotateCw, LogOut } from 'lucide-react';

export function SessionActions() {
  const params = useParams();
  const sessionName = params.id as string;
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, endpoint: string) => {
    setLoading(action);
    try {
      await apiClient.post(`/sessions/${sessionName}${endpoint}`);
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      alert(`Erro ao executar ação: ${action}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações da Sessão</CardTitle>
        <CardDescription>Gerencie o estado da conexão</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleAction('connect', '/connect')}
            disabled={loading !== null}
          >
            <Power className="mr-2 h-4 w-4" />
            {loading === 'connect' ? 'Conectando...' : 'Conectar'}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleAction('disconnect', '/disconnect')}
            disabled={loading !== null}
          >
            <PowerOff className="mr-2 h-4 w-4" />
            {loading === 'disconnect' ? 'Desconectando...' : 'Desconectar'}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleAction('restart', '/restart')}
            disabled={loading !== null}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            {loading === 'restart' ? 'Reiniciando...' : 'Reiniciar'}
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Tem certeza que deseja fazer logout?')) {
                handleAction('logout', '/logout');
              }
            }}
            disabled={loading !== null}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {loading === 'logout' ? 'Saindo...' : 'Logout'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
