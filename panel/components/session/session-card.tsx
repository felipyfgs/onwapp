'use client';

import { Session } from '@/lib/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      connected: 'bg-green-500',
      connecting: 'bg-yellow-500',
      disconnected: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{session.name}</CardTitle>
          <Badge variant={session.status === 'connected' ? 'default' : 'secondary'}>
            {session.status}
          </Badge>
        </div>
        <CardDescription>
          Criado em {new Date(session.createdAt).toLocaleDateString('pt-BR')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${getStatusColor(session.status)}`} />
          <span className="text-sm text-muted-foreground">
            {session.status === 'connected' ? 'Online' : 'Offline'}
          </span>
        </div>
        <Link href={`/sessions/${session.name}`} className="mt-4 block">
          <Button className="w-full">
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
