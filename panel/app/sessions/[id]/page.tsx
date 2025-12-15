'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useActiveSessionStore } from '@/stores/active-session-store';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCodeDialog } from '@/components/session/qr-code-dialog';
import { 
  Power, 
  PowerOff, 
  RotateCw, 
  LogOut,
  MessageSquare,
  Users,
  Users2,
  CheckCircle2,
  XCircle,
  Loader2,
  QrCode,
  Phone,
  Key,
  Copy,
  Check,
  MessagesSquare,
  Webhook,
  User,
  Settings,
  Image as ImageIcon,
  Newspaper,
  Radio,
  Link2
} from "lucide-react";


export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionName = params.id as string;
  const { qrCode, pairingCode, status, pushName, profilePicture, phone, stats: sessionStats } = useActiveSessionStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Auto-open QR dialog when connecting
  useEffect(() => {
    if (status === 'connecting') {
      setQrDialogOpen(true);
    } else if (status === 'connected') {
      // Close dialog after a brief delay when connected
      const timer = setTimeout(() => setQrDialogOpen(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [status]);

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

  const copyApiKey = async () => {
    try {
      const response = await apiClient.get(`/sessions/${sessionName}/status`);
      if (response.data?.apiKey) {
        await navigator.clipboard.writeText(response.data.apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      label: 'Conectado',
      variant: 'default' as const,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-950/50',
    },
    connecting: {
      icon: Loader2,
      label: 'Conectando',
      variant: 'secondary' as const,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-950/50',
    },
    disconnected: {
      icon: XCircle,
      label: 'Desconectado',
      variant: 'destructive' as const,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-950/50',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const formatNumber = (num: number) => num.toLocaleString('pt-BR');

  const stats = [
    { label: 'Mensagens', value: formatNumber(sessionStats?.messages || 0), icon: MessageSquare },
    { label: 'Contatos', value: formatNumber(sessionStats?.contacts || 0), icon: Users },
    { label: 'Grupos', value: formatNumber(sessionStats?.groups || 0), icon: Users2 },
    { label: 'Conversas', value: formatNumber(sessionStats?.chats || 0), icon: MessagesSquare },
  ];

  const quickLinks = [
    { label: 'Mensagens', icon: MessageSquare, href: `/sessions/${sessionName}/messages`, color: 'bg-blue-500' },
    { label: 'Contatos', icon: Users, href: `/sessions/${sessionName}/contacts`, color: 'bg-green-500' },
    { label: 'Grupos', icon: Users2, href: `/sessions/${sessionName}/groups`, color: 'bg-purple-500' },
    { label: 'Mídia', icon: ImageIcon, href: `/sessions/${sessionName}/media`, color: 'bg-orange-500' },
    { label: 'Perfil', icon: User, href: `/sessions/${sessionName}/profile`, color: 'bg-pink-500' },
    { label: 'Newsletter', icon: Newspaper, href: `/sessions/${sessionName}/newsletter`, color: 'bg-cyan-500' },
    { label: 'Status', icon: Radio, href: `/sessions/${sessionName}/status`, color: 'bg-yellow-500' },
    { label: 'Configurações', icon: Settings, href: `/sessions/${sessionName}/settings`, color: 'bg-gray-500' },
  ];

  const integrations = [
    { label: 'Webhooks', icon: Webhook, href: `/sessions/${sessionName}/integrations/webhooks` },
    { label: 'Chatwoot', icon: Link2, href: `/sessions/${sessionName}/integrations/chatwoot` },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Main Session Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Profile & Info */}
            <div className="flex-1 flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profilePicture || undefined} alt={pushName || sessionName} />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {(pushName || sessionName).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Badge variant={config.variant} className="text-xs">
                  <StatusIcon className={`h-3 w-3 mr-1 ${status === 'connecting' ? 'animate-spin' : ''}`} />
                  {config.label}
                </Badge>
              </div>

              {/* Session Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-xl font-semibold">{pushName || sessionName}</h2>
                  <p className="text-sm text-muted-foreground">Sessão: {sessionName}</p>
                </div>

                {phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>+{phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs bg-muted px-2 py-1 rounded">••••••••••••••••</code>
                  <Button variant="ghost" size="icon-sm" onClick={copyApiKey}>
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="lg:w-64 flex flex-col gap-4 justify-center">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleAction('connect', '/connect')}
                  disabled={loading !== null || status === 'connected'}
                >
                  {loading === 'connect' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                  {loading === 'connect' ? 'Conectando...' : 'Conectar'}
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAction('disconnect', '/disconnect')}
                      disabled={loading !== null || status === 'disconnected'}
                    >
                      <PowerOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desconectar</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAction('restart', '/restart')}
                      disabled={loading !== null}
                    >
                      <RotateCw className={`h-4 w-4 ${loading === 'restart' ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reiniciar</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleAction('logout', '/logout')}
                      disabled={loading !== null}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Logout</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
            {quickLinks.map((link) => (
              <Button
                key={link.label}
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={() => router.push(link.href)}
              >
                <div className={`rounded-lg p-2 ${link.color} text-white`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <span className="text-xs">{link.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {integrations.map((integration) => (
              <Button
                key={integration.label}
                variant="outline"
                className="justify-start gap-3"
                onClick={() => router.push(integration.href)}
              >
                <integration.icon className="h-4 w-4" />
                {integration.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <QrCodeDialog
        sessionName={sessionName}
        qrCode={qrCode}
        pairingCode={pairingCode}
        status={status}
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
      />
    </div>
  );
}
