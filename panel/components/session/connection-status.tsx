'use client';

import { useState, useEffect } from 'react';
import { useActiveSessionStore } from '@/stores/active-session-store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Smartphone,
  Clock,
  Battery,
  Signal,
  Globe,
  RefreshCw
} from 'lucide-react';

interface ConnectionDetails {
  phoneNumber: string;
  lastConnected: Date;
  uptime: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  batteryLevel: number;
  isPlugged: boolean;
  platform: string;
  whatsappVersion: string;
}

export function ConnectionStatus() {
  const { status, lastEvent } = useActiveSessionStore();
  const [details, setDetails] = useState<ConnectionDetails | null>(null);

  // Simular dados detalhados - em produção virá da API
  useEffect(() => {
    if (status === 'connected') {
      const mockDetails: ConnectionDetails = {
        phoneNumber: '+55 11 91234-5678',
        lastConnected: new Date(Date.now() - 5 * 60 * 1000),
        uptime: '2d 14h 32m',
        connectionQuality: 'excellent',
        batteryLevel: 78,
        isPlugged: false,
        platform: 'iOS',
        whatsappVersion: '2.23.25.8',
      };
      // Usar setTimeout para evitar renderização cascata
      const timer = setTimeout(() => {
        setDetails(mockDetails);
      }, 0);
      
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setDetails(null);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      label: 'Conectado',
      variant: 'default' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Sua sessão está ativa e conectada',
    },
    connecting: {
      icon: Loader2,
      label: 'Conectando',
      variant: 'secondary' as const,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Estabelecendo conexão com WhatsApp',
    },
    disconnected: {
      icon: XCircle,
      label: 'Desconectado',
      variant: 'destructive' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Clique em "Conectar" para iniciar',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const getConnectionQuality = (quality: string) => {
    const qualityConfig = {
      excellent: { label: 'Excelente', color: 'text-green-600', icon: Signal },
      good: { label: 'Boa', color: 'text-blue-600', icon: Signal },
      fair: { label: 'Regular', color: 'text-yellow-600', icon: Signal },
      poor: { label: 'Fraca', color: 'text-red-600', icon: Signal },
    };
    return qualityConfig[quality as keyof typeof qualityConfig] || qualityConfig.fair;
  };

  const formatLastConnected = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `há ${minutes} minutos`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} horas`;
    
    const days = Math.floor(hours / 24);
    return `há ${days} dias`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Status da Conexão</CardTitle>
        <Badge variant={config.variant} className="capitalize">
          {config.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
              {lastEvent && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Último evento: {lastEvent.event}
                </p>
              )}
            </div>
          </div>

          {details && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Telefone:</span>
                </div>
                <span className="text-sm font-medium">{details.phoneNumber}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Última conexão:</span>
                </div>
                <span className="text-sm font-medium">{formatLastConnected(details.lastConnected)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Uptime:</span>
                </div>
                <span className="text-sm font-medium">{details.uptime}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Signal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Qualidade:</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs">
                      <div className={`w-2 h-2 rounded-full mr-1 ${getConnectionQuality(details.connectionQuality).color.replace('text-', 'bg-')}`} />
                      {getConnectionQuality(details.connectionQuality).label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Qualidade da conexão com WhatsApp</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Bateria:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${details.batteryLevel}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{details.batteryLevel}%</span>
                  {details.isPlugged && <span className="text-xs text-green-600">🔌</span>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Plataforma:</span>
                </div>
                <span className="text-sm font-medium">{details.platform} - {details.whatsappVersion}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
