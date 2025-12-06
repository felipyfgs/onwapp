"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { MessageCircle, Webhook, ArrowRight } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const integrations = [
  {
    id: "chatwoot",
    name: "Chatwoot",
    description: "Integre com o Chatwoot para gerenciar conversas, contatos e atendimento ao cliente em uma única plataforma.",
    icon: MessageCircle,
    href: "integrations/chatwoot",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description: "Configure webhooks para receber notificações em tempo real sobre eventos do WhatsApp.",
    icon: Webhook,
    href: "integrations/webhooks",
    color: "from-purple-500 to-pink-600",
  },
]

export default function IntegrationsPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <>
      <AppHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={`/sessions/${sessionId}`}>
                {sessionId}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Integrações</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </AppHeader>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Conecte sua sessão WhatsApp com outras plataformas e serviços
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className={`h-2 bg-gradient-to-r ${integration.color}`} />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${integration.color} text-white`}>
                    <integration.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>{integration.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {integration.description}
                </CardDescription>
                <Button asChild className="w-full">
                  <Link href={`/sessions/${sessionId}/${integration.href}`}>
                    Configurar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
