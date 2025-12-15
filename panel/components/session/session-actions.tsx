'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  Power, 
  PowerOff, 
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { useActiveSessionStore } from '@/stores/active-session-store';

interface ActionButton {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  variant: 'default' | 'outline' | 'destructive' | 'secondary';
  endpoint: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  disabledStates?: string[];
}

export function SessionActions() {
  const params = useParams();
  const sessionName = params.id as string;
  const { status } = useActiveSessionStore();
  const [loading, setLoading] = useState<string | null>(null);

  const actions: ActionButton[] = [
    {
      id: 'connect',
      label: 'Conectar',
      description: 'Iniciar nova conexão com WhatsApp',
      icon: Power,
      variant: 'default',
      endpoint: '/connect',
      disabledStates: ['connected', 'connecting'],
    },
    {
      id: 'disconnect',
      label: 'Desconectar',
      description: 'Encerrar conexão atual',
      icon: PowerOff,
      variant: 'outline',
      endpoint: '/disconnect',
      disabledStates: ['disconnected', 'connecting'],
    },
    {
      id: 'restart',
      label: 'Reiniciar',
      description: 'Reiniciar sessão e reconectar',
      icon: RefreshCw,
      variant: 'outline',
      endpoint: '/restart',
    },
    {
      id: 'logout',
      label: 'Logout',
      description: 'Desconectar e remover sessão',
      icon: LogOut,
      variant: 'destructive',
      endpoint: '/logout',
      requiresConfirmation: true,
      confirmationMessage: 'Tem certeza que deseja fazer logout? Isso removerá a sessão e você precisará escanear o QR code novamente.',
    },
  ];

  const handleAction = async (action: ActionButton) => {
    if (action.requiresConfirmation) {
      const confirmed = confirm(action.confirmationMessage);
      if (!confirmed) return;
    }

    setLoading(action.id);
    try {
      await apiClient.post(`/sessions/${sessionName}${action.endpoint}`);
    } catch (error) {
      console.error(`Failed to ${action.id}:`, error);
      alert(`Erro ao executar ação: ${action.label}`);
    } finally {
      setLoading(null);
    }
  };

  const isActionDisabled = (action: ActionButton) => {
    if (loading !== null) return true;
    if (action.disabledStates?.includes(status)) return true;
    return false;
  };

  const getConnectionStatusBadge = () => {
    const statusConfig = {
      connected: { label: 'Conectado', variant: 'default' as const },
      connecting: { label: 'Conectando', variant: 'secondary' as const },
      disconnected: { label: 'Desconectado', variant: 'destructive' as const },
    };
    
    return statusConfig[status];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Ações da Sessão</CardTitle>
          <CardDescription className="text-sm">Gerencie o estado da conexão</CardDescription>
        </div>
        <Badge variant={getConnectionStatusBadge().variant}>
          {status === 'connected' && <Wifi className="h-3 w-3 mr-1" />}
          {status === 'disconnected' && <WifiOff className="h-3 w-3 mr-1" />}
          {status === 'connecting' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
          {getConnectionStatusBadge().label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    variant={action.variant}
                    onClick={() => handleAction(action)}
                    disabled={isActionDisabled(action)}
                    className="w-full relative overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {loading === action.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <action.icon className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {loading === action.id ? 'Processando...' : action.label}
                      </span>
                      
                      {action.requiresConfirmation && (
                        <AlertTriangle className="h-3 w-3 ml-1 opacity-70" />
                      )}
                    </div>
                    
                    {loading === action.id && (
                      <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{action.description}</p>
                {action.requiresConfirmation && (
                  <p className="text-xs text-muted-foreground mt-1">Requer confirmação</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Smartphone className="h-3 w-3" />
              <span>Status atual:</span>
            </div>
            <Badge variant={getConnectionStatusBadge().variant} className="text-xs">
              {getConnectionStatusBadge().label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
