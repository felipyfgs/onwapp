'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useActiveSessionStore } from '@/stores/active-session-store';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Power, 
  PowerOff, 
  RotateCw, 
  LogOut,
  MessageSquare,
  Users,
  Users2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight
} from "lucide-react";
import NextImage from 'next/image';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionName = params.id as string;
  const { qrCode, pairingCode, status } = useActiveSessionStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, endpoint: string) => {
    if (action === 'logout' && !confirm('Tem certeza que deseja fazer logout?')) {
      return;
    }

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

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      label: 'Conectado',
      variant: 'default' as const,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    connecting: {
      icon: Loader2,
      label: 'Conectando',
      variant: 'secondary' as const,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    },
    disconnected: {
      icon: XCircle,
      label: 'Desconectado',
      variant: 'destructive' as const,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const stats = [
    { 
      label: 'Mensagens', 
      value: '1,234', 
      icon: MessageSquare, 
      href: `/sessions/${sessionName}/messages`,
      description: 'Total enviadas e recebidas'
    },
    { 
      label: 'Contatos', 
      value: '456', 
      icon: Users, 
      href: `/sessions/${sessionName}/contacts`,
      description: 'Contatos salvos'
    },
    { 
      label: 'Grupos', 
      value: '23', 
      icon: Users2, 
      href: `/sessions/${sessionName}/groups`,
      description: 'Grupos ativos'
    },
    { 
      label: 'Mídia', 
      value: '789', 
      icon: ImageIcon, 
      href: `/sessions/${sessionName}/media`,
      description: 'Arquivos compartilhados'
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Conexão WhatsApp</CardTitle>
              <CardDescription>
                {status === 'connected' 
                  ? 'Sua sessão está ativa e pronta para uso' 
                  : status === 'connecting'
                  ? 'Aguardando escaneamento do QR Code'
                  : 'Conecte sua conta WhatsApp para começar'}
              </CardDescription>
            </div>
            <CardAction>
              <Badge variant={config.variant} className="text-xs">
                <Icon className={`h-3 w-3 mr-1 ${status === 'connecting' ? 'animate-spin' : ''}`} />
                {config.label}
              </Badge>
            </CardAction>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[1fr_auto] gap-6">
            <div className="flex items-center justify-center min-h-[300px]">
              {qrCode ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                  <div className="relative w-full aspect-square max-w-[320px] rounded-xl border-2 bg-white dark:bg-gray-950 p-4 shadow-lg">
                    <NextImage
                      src={qrCode}
                      alt="QR Code para conectar WhatsApp"
                      fill
                      className="object-contain"
                      unoptimized
                      priority
                    />
                  </div>
                  {pairingCode && (
                    <div className="text-center space-y-2 bg-muted/50 rounded-lg p-4 w-full">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Código de Pareamento
                      </p>
                      <p className="text-3xl font-mono font-bold tracking-widest">{pairingCode}</p>
                      <p className="text-xs text-muted-foreground">
                        Use este código se não conseguir escanear o QR Code
                      </p>
                    </div>
                  )}
                </div>
              ) : status === 'connected' ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className={`rounded-full p-6 ${config.bgColor}`}>
                    <Icon className={`h-16 w-16 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Sessão Ativa</h3>
                    <p className="text-muted-foreground mt-2">Conectado e funcionando perfeitamente</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className={`rounded-full p-6 ${config.bgColor}`}>
                    <Icon className={`h-16 w-16 ${config.color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{config.label}</h3>
                    <p className="text-muted-foreground mt-2">
                      {status === 'connecting' ? 'Aguarde, carregando QR Code...' : 'Clique em Conectar para iniciar'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:min-w-[220px] md:max-w-[220px]">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Ações
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="default"
                  size="default"
                  onClick={() => handleAction('connect', '/connect')}
                  disabled={loading !== null || status === 'connected'}
                  className="w-full justify-start"
                >
                  <Power className="h-4 w-4 mr-2" />
                  <span>{loading === 'connect' ? 'Conectando...' : 'Conectar'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleAction('disconnect', '/disconnect')}
                  disabled={loading !== null || status === 'disconnected'}
                  className="w-full justify-start"
                >
                  <PowerOff className="h-4 w-4 mr-2" />
                  <span>{loading === 'disconnect' ? 'Desconectando...' : 'Desconectar'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleAction('restart', '/restart')}
                  disabled={loading !== null}
                  className="w-full justify-start"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  <span>{loading === 'restart' ? 'Reiniciando...' : 'Reiniciar'}</span>
                </Button>

                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => handleAction('logout', '/logout')}
                  disabled={loading !== null}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>{loading === 'logout' ? 'Saindo...' : 'Logout'}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card 
            key={stat.label}
            className="cursor-pointer hover:shadow-md transition-all shadow-xs group"
            onClick={() => router.push(stat.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="rounded-lg p-2 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
