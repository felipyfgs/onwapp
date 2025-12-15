'use client';

import { useActiveSessionStore } from '@/stores/active-session-store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function ConnectionStatus() {
  const { status, lastEvent } = useActiveSessionStore();

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      label: 'Conectado',
      variant: 'default' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    connecting: {
      icon: Loader2,
      label: 'Conectando',
      variant: 'secondary' as const,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    disconnected: {
      icon: XCircle,
      label: 'Desconectado',
      variant: 'destructive' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status da Conexão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${config.bgColor}`}>
            <Icon className={`h-5 w-5 ${config.color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <Badge variant={config.variant}>{config.label}</Badge>
            {lastEvent && (
              <p className="mt-1 text-xs text-muted-foreground">
                Último evento: {lastEvent.event}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
