'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Webhook, MessageSquare, Settings, ChevronRight } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  href: string;
  status: 'connected' | 'disconnected';
  badge?: string;
}

export default function IntegrationsPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const integrations: Integration[] = [
    {
      id: 'webhooks',
      name: 'Webhooks',
      description: 'Receba eventos em tempo real do WhatsApp via HTTP',
      icon: Webhook,
      href: `/sessions/${sessionId}/integrations/webhooks`,
      status: 'disconnected',
      badge: 'Popular'
    },
    {
      id: 'chatwoot',
      name: 'Chatwoot',
      description: 'Integre com a plataforma de atendimento ao cliente',
      icon: MessageSquare,
      href: `/sessions/${sessionId}/integrations/chatwoot`,
      status: 'disconnected',
      badge: 'Recomendado'
    }
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrações</h2>
          <p className="text-muted-foreground">Conecte sua sessão com outras plataformas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Link key={integration.id} href={integration.href}>
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {integration.name}
                          {integration.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {integration.badge}
                            </Badge>
                          )}
                        </CardTitle>
                        <Badge 
                          variant={integration.status === 'connected' ? 'default' : 'outline'}
                          className="mt-1"
                        >
                          {integration.status === 'connected' ? 'Conectado' : 'Desconectado'}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{integration.description}</CardDescription>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Mais integrações em breve</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Estamos trabalhando para adicionar mais integrações e facilitar a conexão com suas ferramentas favoritas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
