'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useGroupStore } from '@/stores/group-store';
import apiClient from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Settings, LogOut } from 'lucide-react';

export function GroupList() {
  const params = useParams();
  const sessionId = params.id as string;
  const { groups, loading, setGroups, setSelectedGroup, setLoading } = useGroupStore();

  useEffect(() => {
    fetchGroups();
  }, [sessionId]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/group/list`);
      setGroups(response.data || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (jid: string) => {
    if (!confirm('Tem certeza que deseja sair deste grupo?')) return;

    try {
      await apiClient.post(`/sessions/${sessionId}/group/leave`, { jid });
      fetchGroups();
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando grupos...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Participantes</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Nenhum grupo encontrado
              </TableCell>
            </TableRow>
          ) : (
            groups.map((group) => (
              <TableRow key={group.jid}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>{group.subject}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {group.participants?.length || 0}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGroup(group)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleLeave(group.jid)}
                    >
                      <LogOut className="h-4 w-4" />
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
