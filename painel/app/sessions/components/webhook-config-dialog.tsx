'use client'

import { useState, useEffect, useCallback } from 'react'
import { Webhook, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getWebhook, setWebhook, updateWebhook, deleteWebhook } from '@/lib/actions/sessions'
import { WebhookResponse } from '@/types/session'
import { toast } from 'sonner'

interface WebhookConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionName: string
}

const AVAILABLE_EVENTS = [
  'message',
  'message.ack',
  'message.reaction',
  'presence.update',
  'call',
  'qr',
  'connection.update',
]

export function WebhookConfigDialog({
  open,
  onOpenChange,
  sessionName,
}: WebhookConfigDialogProps) {
  const [url, setUrl] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['message'])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [existingWebhook, setExistingWebhook] = useState<WebhookResponse | null>(null)

  const loadWebhook = useCallback(async () => {
    setLoadingData(true)
    try {
      const data = await getWebhook(sessionName)
      setExistingWebhook(data)
      if (data) {
        setUrl(data.url)
        setEnabled(data.enabled)
        setSelectedEvents(data.events.length > 0 ? data.events : ['message'])
      } else {
        setUrl('')
        setEnabled(true)
        setSelectedEvents(['message'])
      }
    } catch {
      setExistingWebhook(null)
    } finally {
      setLoadingData(false)
    }
  }, [sessionName])

  useEffect(() => {
    if (open) {
      loadWebhook()
    }
  }, [open, loadWebhook])

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!url.trim()) {
      toast.error('Digite a URL do webhook')
      return
    }

    if (selectedEvents.length === 0) {
      toast.error('Selecione pelo menos um evento')
      return
    }

    setLoading(true)
    try {
      const data = { url, enabled, events: selectedEvents }
      if (existingWebhook) {
        await updateWebhook(sessionName, data)
        toast.success('Webhook atualizado!')
      } else {
        await setWebhook(sessionName, data)
        toast.success('Webhook configurado!')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao configurar webhook')
      console.error('Webhook config failed:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteWebhook(sessionName)
      toast.success('Webhook removido!')
      setExistingWebhook(null)
      setUrl('')
      setEnabled(true)
      setSelectedEvents(['message'])
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao remover webhook')
      console.error('Webhook delete failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-600" />
            Configurar Webhook
          </DialogTitle>
          <DialogDescription>
            Configure a URL para receber eventos da sessao {sessionName}.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://seu-servidor.com/webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhook Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Habilita ou desabilita o envio de eventos
                  </p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>

              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleEvent(event)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        selectedEvents.includes(event)
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {existingWebhook && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="sm:mr-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : existingWebhook ? (
                  'Atualizar'
                ) : (
                  'Configurar'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
