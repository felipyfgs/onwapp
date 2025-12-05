"use client"

import * as React from "react"
import { use } from "react"
import { Plus, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { SessionHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { api } from "@/lib/api"
import { WEBHOOK_EVENTS, type Webhook } from "@/types"

interface WebhooksPageProps {
  params: Promise<{ id: string }>
}

export default function WebhooksPage({ params }: WebhooksPageProps) {
  const { id } = use(params)
  const [webhook, setWebhook] = React.useState<Webhook | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  
  const [url, setUrl] = React.useState("")
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([])
  const [enabled, setEnabled] = React.useState(true)

  const fetchWebhook = React.useCallback(async () => {
    try {
      const data = await api.webhooks.get(id)
      setWebhook(data)
      setUrl(data.url || "")
      setSelectedEvents(data.events || [])
      setEnabled(data.enabled ?? true)
    } catch {
      setWebhook(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchWebhook()
  }, [fetchWebhook])

  const handleSave = async () => {
    if (!url.trim()) {
      toast.error("URL e obrigatoria")
      return
    }

    setSaving(true)
    try {
      await api.webhooks.set(id, {
        url: url.trim(),
        events: selectedEvents,
        enabled,
      })
      toast.success("Webhook salvo com sucesso")
      setDialogOpen(false)
      fetchWebhook()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar webhook")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.webhooks.delete(id)
      toast.success("Webhook removido com sucesso")
      setWebhook(null)
      setUrl("")
      setSelectedEvents([])
      setEnabled(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover webhook")
    }
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  if (loading) {
    return (
      <>
        <SessionHeader sessionId={id} pageTitle="Webhooks" />
        <div className="flex-1 p-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <SessionHeader sessionId={id} pageTitle="Webhooks" />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Webhooks</h2>
            <p className="text-muted-foreground">
              Configure webhooks para receber notificacoes de eventos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {webhook ? "Editar Webhook" : "Adicionar Webhook"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {webhook ? "Editar Webhook" : "Adicionar Webhook"}
                </DialogTitle>
                <DialogDescription>
                  Configure a URL e os eventos que deseja receber
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="webhook-url">URL do Webhook</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://seu-servidor.com/webhook"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="webhook-enabled">Ativo</Label>
                  <Switch
                    id="webhook-enabled"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Eventos</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <Badge
                        key={event}
                        variant={selectedEvents.includes(event) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleEvent(event)}
                      >
                        {event}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique para selecionar/deselecionar eventos
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {webhook ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {webhook.url}
                  </CardTitle>
                  <CardDescription>
                    {webhook.enabled ? "Ativo" : "Inativo"} - {webhook.events?.length || 0} eventos
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Webhook?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acao nao pode ser desfeita. O webhook sera permanentemente removido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Eventos configurados</h4>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events?.length ? (
                      webhook.events.map((event) => (
                        <Badge key={event} variant="secondary">
                          {event}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum evento configurado</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum webhook configurado
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Webhook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
