'use client'

import { use, useEffect, useState, useCallback } from 'react'
import {
  IconWebhook,
  IconLoader2,
  IconCheck,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconRefresh,
} from '@tabler/icons-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getWebhook, setWebhook, deleteWebhook, getWebhookEvents } from '@/lib/api'
import type { WebhookConfig, WebhookEvents } from '@/lib/types'

const categoryLabels: Record<string, string> = {
  session: 'Sessao',
  message: 'Mensagens',
  contact: 'Contatos',
  group: 'Grupos',
  call: 'Chamadas',
  presence: 'Presenca',
  sync: 'Sincronizacao',
  privacy: 'Privacidade',
  newsletter: 'Canais',
  chat: 'Chats',
}

export default function WebhookPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [events, setEvents] = useState<WebhookEvents | null>(null)

  const [config, setConfig] = useState<Partial<WebhookConfig>>({
    enabled: false,
    url: '',
    events: [],
    secret: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [webhookData, eventsData] = await Promise.all([
        getWebhook(name).catch(() => null),
        getWebhookEvents(),
      ])
      setEvents(eventsData)
      if (webhookData) {
        setConfig({
          enabled: webhookData.enabled,
          url: webhookData.url || '',
          events: webhookData.events || [],
          secret: '',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar webhook:', error)
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setWebhook(name, config)
      await fetchData()
    } catch (error) {
      console.error('Erro ao salvar webhook:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteWebhook(name)
      setConfig({ enabled: false, url: '', events: [], secret: '' })
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Erro ao excluir webhook:', error)
    } finally {
      setDeleting(false)
    }
  }

  const toggleEvent = (event: string) => {
    setConfig((prev) => ({
      ...prev,
      events: prev.events?.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...(prev.events || []), event],
    }))
  }

  const toggleCategory = (categoryEvents: string[]) => {
    const allSelected = categoryEvents.every((e) => config.events?.includes(e))
    setConfig((prev) => ({
      ...prev,
      events: allSelected
        ? prev.events?.filter((e) => !categoryEvents.includes(e)) || []
        : [...new Set([...(prev.events || []), ...categoryEvents])],
    }))
  }

  const selectAll = () => {
    if (events) {
      setConfig((prev) => ({ ...prev, events: [...events.all] }))
    }
  }

  const clearAll = () => {
    setConfig((prev) => ({ ...prev, events: [] }))
  }

  const selectedCount = config.events?.length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhook</h1>
          <p className="text-muted-foreground">Configure webhooks para receber eventos da sessao</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <IconRefresh className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconWebhook className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Configuracao do Webhook</CardTitle>
                <CardDescription>Receba notificacoes de eventos via HTTP POST</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="enabled">Ativo</Label>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url">URL do Webhook *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://seu-servidor.com/webhook"
              value={config.url}
              onChange={(e) => setConfig((prev) => ({ ...prev, url: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">URL que recebera os eventos via POST</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Secret (opcional)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="secret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Chave secreta para assinatura HMAC"
                  value={config.secret}
                  onChange={(e) => setConfig((prev) => ({ ...prev, secret: e.target.value }))}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Se definido, os eventos serao assinados com HMAC-SHA256
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Eventos</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione os eventos que deseja receber
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedCount} selecionados</Badge>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Todos
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Limpar
                </Button>
              </div>
            </div>

            {events && (
              <Accordion type="multiple" className="w-full">
                {Object.entries(events.categories).map(([category, categoryEvents]) => {
                  const selectedInCategory = categoryEvents.filter((e) =>
                    config.events?.includes(e)
                  ).length
                  const allSelected = selectedInCategory === categoryEvents.length

                  return (
                    <AccordionItem key={category} value={category}>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleCategory(categoryEvents)}
                        />
                        <AccordionTrigger className="hover:no-underline flex-1 py-4">
                          <div className="flex items-center gap-2">
                            <span>{categoryLabels[category] || category}</span>
                            <Badge variant={allSelected ? 'default' : 'secondary'}>
                              {selectedInCategory}/{categoryEvents.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8 pt-2">
                          {categoryEvents.map((event) => (
                            <label
                              key={event}
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                            >
                              <Checkbox
                                checked={config.events?.includes(event)}
                                onCheckedChange={() => toggleEvent(event)}
                              />
                              <code className="text-xs">{event}</code>
                            </label>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={!config.url}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Excluir Webhook
            </Button>
            <Button onClick={handleSave} disabled={saving || !config.url}>
              {saving ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a configuracao do webhook? Esta acao nao pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
