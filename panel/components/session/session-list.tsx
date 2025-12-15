'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/stores/session-store';
import apiClient from '@/lib/api';
import { Session } from '@/lib/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Power, PowerOff } from 'lucide-react';
import Link from 'next/link';

export function SessionList() {
  const { sessions, loading, setSessions, setLoading, removeSession } = useSessionStore();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/sessions');
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;

    try {
      await apiClient.delete(`/sessions/${id}`);
      removeSession(id);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleConnect = async (name: string) => {
    try {
      await apiClient.post(`/sessions/${name}/connect`);
    } catch (error) {
      console.error('Failed to connect session:', error);
    }
  };

  const handleDisconnect = async (name: string) => {
    try {
      await apiClient.post(`/sessions/${name}/disconnect`);
    } catch (error) {
      console.error('Failed to disconnect session:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      connected: 'default',
      connecting: 'secondary',
      disconnected: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Carregando sessões...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Nenhuma sessão encontrada
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.session}</TableCell>
                <TableCell>{getStatusBadge(session.status)}</TableCell>
                <TableCell>
                  {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/sessions/${session.session}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {session.status === 'disconnected' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(session.session)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(session.session)}
                      >
                        <PowerOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
