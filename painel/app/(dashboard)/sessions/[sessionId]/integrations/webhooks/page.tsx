"use client"

import { useState, useEffect, use } from "react"
import { Loader2, Save, Trash2, Webhook } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  getWebhook, 
  setWebhook, 
  deleteWebhook, 
  getWebhookEvents,
  type Webhook as WebhookType,
  type WebhookEvents,
} from "@/lib/api/webhooks"

export default function WebhooksPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [webhook, setWebhookState] = useState<WebhookType | null>(null)
  const [events, setEvents] = useState<WebhookEvents | null>(null)
  const [url, setUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [webhookData, eventsData] = await Promise.all([
          getWebhook(sessionId).catch(() => null),
          getWebhookEvents(),
        ])
        
        if (webhookData && webhookData.url) {
          setWebhookState(webhookData)
          setUrl(webhookData.url)
          setSelectedEvents(webhookData.events || [])
          setEnabled(webhookData.enabled)
        }
        
        setEvents(eventsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const data = await setWebhook(sessionId, {
        url,
        events: selectedEvents,
        enabled,
        secret: secret || undefined,
      })
      setWebhookState(data)
      setSuccess('Webhook salvo com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Deseja remover o webhook?')) return
    
    setSaving(true)
    setError(null)
    
    try {
      await deleteWebhook(sessionId)
      setWebhookState(null)
      setUrl("")
      setSelectedEvents([])
      setEnabled(true)
      setSuccess('Webhook removido!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover')
    } finally {
      setSaving(false)
    }
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  const selectAllEvents = () => {
    if (events?.all) {
      setSelectedEvents(events.all)
    }
  }

  const clearAllEvents = () => {
    setSelectedEvents([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessoes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}/integrations`}>Integracoes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Webhooks</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Webhook className="size-6" />
              Webhooks
            </h1>
            <p className="text-muted-foreground">
              Configure webhooks para receber eventos do WhatsApp
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuracao</CardTitle>
              <CardDescription>
                URL para onde os eventos serao enviados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL do Webhook</label>
                <Input
                  placeholder="https://seu-servidor.com/webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Secret (opcional)</label>
                <Input
                  type="password"
                  placeholder="Secret para validacao"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O secret sera enviado no header X-Webhook-Secret
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="enabled" className="text-sm">
                  Webhook habilitado
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Eventos</CardTitle>
                  <CardDescription>
                    Selecione os eventos que deseja receber
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllEvents}>
                    Selecionar todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllEvents}>
                    Limpar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {events?.categories && Object.entries(events.categories).map(([category, categoryEvents]) => (
                <div key={category} className="mb-4">
                  <h4 className="font-medium text-sm mb-2 capitalize">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {categoryEvents.map((event) => (
                      <button
                        key={event}
                        onClick={() => toggleEvent(event)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          selectedEvents.includes(event)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {event}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !url}>
              {saving ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Salvar
            </Button>

            {webhook && (
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                <Trash2 className="size-4 mr-2" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
