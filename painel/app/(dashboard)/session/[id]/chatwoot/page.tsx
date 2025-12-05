"use client"

import * as React from "react"
import { use } from "react"
import { MessageSquare, Save } from "lucide-react"
import { toast } from "sonner"

import { SessionHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface ChatwootPageProps {
  params: Promise<{ id: string }>
}

export default function ChatwootPage({ params }: ChatwootPageProps) {
  const { id } = use(params)
  const [saving, setSaving] = React.useState(false)
  
  const [enabled, setEnabled] = React.useState(false)
  const [apiUrl, setApiUrl] = React.useState("")
  const [apiToken, setApiToken] = React.useState("")
  const [inboxId, setInboxId] = React.useState("")

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Implement Chatwoot API integration
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Configuracoes salvas com sucesso")
    } catch {
      toast.error("Erro ao salvar configuracoes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SessionHeader sessionId={id} pageTitle="Chatwoot" />
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chatwoot</h2>
          <p className="text-muted-foreground">
            Integre sua sessao com o Chatwoot para atendimento ao cliente
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Configuracoes do Chatwoot
            </CardTitle>
            <CardDescription>
              Configure a integracao com sua instancia do Chatwoot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Integracao Ativa</Label>
                <p className="text-sm text-muted-foreground">
                  Ative para sincronizar mensagens com o Chatwoot
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="api-url">URL da API</Label>
                <Input
                  id="api-url"
                  placeholder="https://app.chatwoot.com"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  disabled={!enabled}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api-token">Token da API</Label>
                <Input
                  id="api-token"
                  type="password"
                  placeholder="Seu token de acesso"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  disabled={!enabled}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inbox-id">ID da Inbox</Label>
                <Input
                  id="inbox-id"
                  placeholder="123"
                  value={inboxId}
                  onChange={(e) => setInboxId(e.target.value)}
                  disabled={!enabled}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving || !enabled}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
