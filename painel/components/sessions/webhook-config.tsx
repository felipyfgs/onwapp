"use client"

import * as React from "react"
import { CheckCircle, Loader2, Save, Trash2, Webhook as WebhookIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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

import type { Webhook, WebhookEventsResponse } from "@/lib/types/webhook"
import {
  getWebhook,
  setWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookEvents,
} from "@/lib/api/webhooks"

interface WebhookConfigProps {
  sessionId: string
}

export function WebhookConfig({ sessionId }: WebhookConfigProps) {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [webhook, setWebhookData] = React.useState<Webhook | null>(null)
  const [events, setEvents] = React.useState<WebhookEventsResponse | null>(null)

  // Form state
  const [url, setUrl] = React.useState("")
  const [enabled, setEnabled] = React.useState(false)
  const [secret, setSecret] = React.useState("")
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([])

  const loadData = React.useCallback(async () => {
    try {
      const [webhookData, eventsData] = await Promise.all([
        getWebhook(sessionId).catch(() => null), // 404 = not configured yet
        getWebhookEvents(),
      ])

      setWebhookData(webhookData)
      setEvents(eventsData)

      // Populate form
      if (webhookData) {
        setUrl(webhookData.url || "")
        setEnabled(webhookData.enabled)
        setSelectedEvents(webhookData.events || [])
      }
    } catch (error) {
      console.error("Failed to load webhook events:", error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async () => {
    if (!url && enabled) {
      toast.error("URL é obrigatória quando o webhook está habilitado")
      return
    }

    setSaving(true)
    try {
      const data = {
        url,
        events: selectedEvents,
        enabled,
        secret: secret || undefined,
      }

      if (webhook?.id) {
        await updateWebhook(sessionId, data)
      } else {
        await setWebhook(sessionId, data)
      }

      toast.success("Webhook salvo com sucesso")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar webhook")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteWebhook(sessionId)
      toast.success("Webhook deletado")
      setWebhookData(null)
      setUrl("")
      setEnabled(false)
      setSecret("")
      setSelectedEvents([])
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar webhook")
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
      setSelectedEvents((prev) =>
        prev.filter((e) => !categoryEvents.includes(e))
      )
    } else {
      setSelectedEvents((prev) => [
        ...prev,
        ...categoryEvents.filter((e) => !prev.includes(e)),
      ])
    }
  }

  const selectAll = () => {
    if (events) {
      setSelectedEvents([...events.all])
    }
  }

  const deselectAll = () => {
    setSelectedEvents([])
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      {webhook?.id && (
        <div className="flex items-center justify-between">
          <Badge variant="default" className={enabled ? "bg-emerald-600" : "bg-secondary"}>
            <CheckCircle className="h-3 w-3" />
            {enabled ? "Integração Ativa" : "Integração Inativa"}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover integração?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá desativar a integração de Webhook. Você poderá configurar novamente depois.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <WebhookIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Configuração de Webhook</CardTitle>
          </div>
          <CardDescription>
            Configure uma URL para receber eventos do WhatsApp em tempo real.
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Enabled Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Webhook Habilitado</Label>
            <p className="text-sm text-muted-foreground">
              Ative para enviar eventos para a URL configurada
            </p>
          </div>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="url">URL do Webhook</Label>
          <Input
            id="url"
            placeholder="https://seu-servidor.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            URL que receberá os eventos via POST
          </p>
        </div>

        {/* Secret Input */}
        <div className="space-y-2">
          <Label htmlFor="secret">Secret (opcional)</Label>
          <Input
            id="secret"
            type="password"
            placeholder="Token secreto para validação"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Será enviado no header X-Webhook-Secret para validação
          </p>
        </div>

        {/* Events Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Eventos</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Selecionar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Limpar
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {selectedEvents.length} evento(s) selecionado(s)
          </p>

          {events && (
            <Accordion type="multiple" className="w-full">
              {Object.entries(events.categories).map(([category, categoryEvents]) => {
                const selectedCount = categoryEvents.filter((e) => selectedEvents.includes(e)).length
                const allSelected = selectedCount === categoryEvents.length
                const someSelected = selectedCount > 0 && !allSelected
                
                return (
                <AccordionItem key={category} value={category}>
                  <div className="flex items-center">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={() => toggleCategory(categoryEvents)}
                      className="mr-2"
                    />
                    <AccordionTrigger className="hover:no-underline flex-1">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{category}</span>
                        <Badge variant="secondary" className="ml-2">
                          {categoryEvents.filter((e) => selectedEvents.includes(e)).length}/
                          {categoryEvents.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent>
                    <div className="grid gap-2 pl-6">
                      {categoryEvents.map((event) => (
                        <div
                          key={event}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={event}
                            checked={selectedEvents.includes(event)}
                            onCheckedChange={() => toggleEvent(event)}
                          />
                          <label
                            htmlFor={event}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {event}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )})}
            </Accordion>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {webhook?.id ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

