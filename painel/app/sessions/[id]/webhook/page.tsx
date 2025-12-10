"use client"

import { useEffect, useState, useCallback, use } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Webhook, Loader2, Save, Trash2, ExternalLink } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  WebhookConfig,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getAvailableEvents,
  EventsResponse,
} from "@/lib/api/webhook"

interface WebhookPageProps {
  params: Promise<{ id: string }>
}

export default function WebhookPage({ params }: WebhookPageProps) {
  const { id } = use(params)

  const [webhook, setWebhook] = useState<WebhookConfig | null>(null)
  const [events, setEvents] = useState<EventsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [url, setUrl] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [secret, setSecret] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [webhookData, eventsData] = await Promise.all([
        getWebhook(id),
        getAvailableEvents(),
      ])
      setWebhook(webhookData)
      setEvents(eventsData)

      if (webhookData) {
        setUrl(webhookData.url || "")
        setEnabled(webhookData.enabled)
        setSelectedEvents(webhookData.events || [])
      }
    } catch (error) {
      console.error("Failed to fetch webhook data:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!url.trim()) return

    setSaving(true)
    try {
      const data = {
        url: url.trim(),
        enabled,
        events: selectedEvents.length > 0 ? selectedEvents : undefined,
        secret: secret.trim() || undefined,
      }

      if (webhook) {
        await updateWebhook(id, data)
      } else {
        await createWebhook(id, data)
      }
      await fetchData()
    } catch (error) {
      console.error("Failed to save webhook:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteWebhook(id)
      setWebhook(null)
      setUrl("")
      setEnabled(true)
      setSecret("")
      setSelectedEvents([])
    } catch (error) {
      console.error("Failed to delete webhook:", error)
    } finally {
      setDeleting(false)
    }
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    )
  }

  const toggleCategory = (categoryEvents: string[]) => {
    const allSelected = categoryEvents.every((e) => selectedEvents.includes(e))
    if (allSelected) {
      setSelectedEvents((prev) => prev.filter((e) => !categoryEvents.includes(e)))
    } else {
      setSelectedEvents((prev) => [...new Set([...prev, ...categoryEvents])])
    }
  }

  const selectAll = () => {
    if (events?.all) {
      setSelectedEvents(events.all)
    }
  }

  const selectNone = () => {
    setSelectedEvents([])
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Webhook</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Config Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                      <Webhook className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Configuração do Webhook</CardTitle>
                      <CardDescription>Receba eventos em tempo real</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enabled" className="text-sm text-muted-foreground">
                      {enabled ? "Ativo" : "Inativo"}
                    </Label>
                    <Switch
                      id="enabled"
                      checked={enabled}
                      onCheckedChange={setEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL do Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      placeholder="https://seu-servidor.com/webhook"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    {url && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret">Secret (opcional)</Label>
                  <Input
                    id="secret"
                    type="password"
                    placeholder="Chave secreta para validar requisições"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Será enviado no header X-Webhook-Secret
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving || !url.trim()}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {webhook ? "Atualizar" : "Criar"} Webhook
                  </Button>

                  {webhook && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={deleting}>
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O webhook será removido e você não receberá mais eventos desta sessão.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Events Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Eventos</CardTitle>
                    <CardDescription>
                      Selecione os eventos que deseja receber ({selectedEvents.length} selecionados)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectNone}>
                      Nenhum
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {events?.categories ? (
                  <div className="space-y-6">
                    {Object.entries(events.categories).map(([category, categoryEvents]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`cat-${category}`}
                            checked={categoryEvents.every((e) => selectedEvents.includes(e))}
                            onCheckedChange={() => toggleCategory(categoryEvents)}
                          />
                          <Label
                            htmlFor={`cat-${category}`}
                            className="text-sm font-semibold capitalize cursor-pointer"
                          >
                            {category.replace(/_/g, " ")}
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            ({categoryEvents.filter((e) => selectedEvents.includes(e)).length}/{categoryEvents.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pl-6">
                          {categoryEvents.map((event) => (
                            <div key={event} className="flex items-center gap-2">
                              <Checkbox
                                id={event}
                                checked={selectedEvents.includes(event)}
                                onCheckedChange={() => toggleEvent(event)}
                              />
                              <Label
                                htmlFor={event}
                                className="text-xs cursor-pointer truncate"
                                title={event}
                              >
                                {event.split(".").pop()}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento disponível
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
