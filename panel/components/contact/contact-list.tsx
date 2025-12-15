'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useContactStore } from '@/stores/contact-store';
import apiClient from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function ContactList() {
  const params = useParams();
  const sessionId = params.id as string;
  const { contacts, loading, setContacts, setLoading } = useContactStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchContacts();
  }, [sessionId]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/contact/list`);
      setContacts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name?.toLowerCase().includes(search.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '??';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando contatos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar contatos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  {search ? 'Nenhum contato encontrado' : 'Nenhum contato'}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.jid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{contact.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
