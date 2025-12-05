"use client"

import * as React from "react"
import { use } from "react"
import { Puzzle, Webhook, MessageSquare, Database, Zap } from "lucide-react"

import { SessionHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface IntegrationsPageProps {
  params: Promise<{ id: string }>
}

const integrations = [
  {
    id: "webhook",
    name: "Webhooks",
    description: "Receba notificacoes de eventos via HTTP",
    icon: Webhook,
    status: "available",
    href: "webhooks",
  },
  {
    id: "chatwoot",
    name: "Chatwoot",
    description: "Plataforma de atendimento ao cliente",
    icon: MessageSquare,
    status: "available",
    href: "chatwoot",
  },
  {
    id: "n8n",
    name: "n8n",
    description: "Automacao de workflows",
    icon: Zap,
    status: "coming_soon",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Banco de dados em tempo real",
    icon: Database,
    status: "coming_soon",
  },
]

export default function IntegrationsPage({ params }: IntegrationsPageProps) {
  const { id } = use(params)

  return (
    <>
      <SessionHeader sessionId={id} pageTitle="Integracoes" />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integracoes</h2>
          <p className="text-muted-foreground">
            Conecte sua sessao com outras ferramentas e servicos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <integration.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={integration.status === "available" ? "default" : "secondary"}
                  >
                    {integration.status === "available" ? "Disponivel" : "Em breve"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {integration.status === "available" && integration.href && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`/session/${id}/${integration.href}`}>
                      <Puzzle className="mr-2 h-4 w-4" />
                      Configurar
                    </a>
                  </Button>
                )}
                {integration.status === "coming_soon" && (
                  <Button variant="outline" className="w-full" disabled>
                    Em desenvolvimento
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
