"use client"

import { useState, useEffect, use, useCallback } from "react"
import { Loader2, Trash2 } from "lucide-react"
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
import { WebhookConfigCard, EventsCard } from "@/components/webhooks"
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
  const [openCategories, setOpenCategories] = useState<string[]>([])

  const autoSave = useCallback(async (updates: { url?: string; events?: string[]; enabled?: boolean; secret?: string }) => {
    const newUrl = updates.url ?? url
    if (!newUrl) return
    
    setSaving(true)
    try {
      const data = await setWebhook(sessionId, {
        url: newUrl,
        events: updates.events ?? selectedEvents,
        enabled: updates.enabled ?? enabled,
        secret: updates.secret ?? secret || undefined,
      })
      setWebhookState(data)
    } catch {
      // Silent error
    } finally {
      setSaving(false)
    }
  }, [sessionId, url, selectedEvents, enabled, secret])

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
        if (eventsData?.categories) {
          setOpenCategories(Object.keys(eventsData.categories))
        }
      } catch {
        // Silent error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const handleUrlBlur = () => {
    if (url && url !== webhook?.url) {
      autoSave({ url })
    }
  }

  const handleSecretBlur = () => {
    if (url) {
      autoSave({ secret })
    }
  }

  const handleEnabledChange = (value: boolean) => {
    setEnabled(value)
    if (url) {
      autoSave({ enabled: value })
    }
  }

  const handleDelete = async () => {
    if (!confirm('Remover webhook?')) return
    
    setSaving(true)
    try {
      await deleteWebhook(sessionId)
      setWebhookState(null)
      setUrl("")
      setSecret("")
      setSelectedEvents([])
      setEnabled(true)
    } catch {
      // Silent error
    } finally {
      setSaving(false)
    }
  }

  const toggleEvent = (event: string) => {
    const newEvents = selectedEvents.includes(event) 
      ? selectedEvents.filter(e => e !== event)
      : [...selectedEvents, event]
    setSelectedEvents(newEvents)
    if (url) {
      autoSave({ events: newEvents })
    }
  }

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleAllInCategory = (categoryEvents: string[]) => {
    const allSelected = categoryEvents.every(e => selectedEvents.includes(e))
    const newEvents = allSelected
      ? selectedEvents.filter(e => !categoryEvents.includes(e))
      : [...new Set([...selectedEvents, ...categoryEvents])]
    setSelectedEvents(newEvents)
    if (url) {
      autoSave({ events: newEvents })
    }
  }

  const selectAllEvents = () => {
    if (events?.all) {
      setSelectedEvents(events.all)
      if (url) {
        autoSave({ events: events.all })
      }
    }
  }

  const clearAllEvents = () => {
    setSelectedEvents([])
    if (url) {
      autoSave({ events: [] })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalEvents = events?.all?.length || 0
  const selectedCount = selectedEvents.length

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Webhooks</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Webhook</h1>
          <div className="flex items-center gap-2">
            {saving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {webhook && (
              <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0 divide-y">
            {/* URL */}
            <div className="flex items-center gap-3 p-3">
              <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Globe className="size-4" />
              </div>
              <Input
                placeholder="https://seu-servidor.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>

            {/* Secret */}
            <div className="flex items-center gap-3 p-3">
              <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Key className="size-4" />
              </div>
              <Input
                type="password"
                placeholder="Secret (opcional)"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onBlur={handleSecretBlur}
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
            </div>

            {/* Enabled */}
            <div className="flex items-center justify-between p-3">
              <span className="text-sm">Ativo</span>
              <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium">Eventos ({selectedCount}/{totalEvents})</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllEvents}>
                  Todos
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAllEvents}>
                  Nenhum
                </Button>
              </div>
            </div>

            <div className="divide-y">
              {events?.categories && Object.entries(events.categories).map(([category, categoryEvents]) => {
                const selectedInCategory = categoryEvents.filter(e => selectedEvents.includes(e)).length
                const allSelected = selectedInCategory === categoryEvents.length
                const isOpen = openCategories.includes(category)

                return (
                  <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
                    <div className="flex items-center">
                      <CollapsibleTrigger className="flex-1 flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors">
                        <ChevronDown className={`size-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                        <span className="text-sm capitalize">{category}</span>
                        <span className="text-xs text-muted-foreground ml-auto mr-2">
                          {selectedInCategory}/{categoryEvents.length}
                        </span>
                      </CollapsibleTrigger>
                      <button
                        onClick={() => toggleAllInCategory(categoryEvents)}
                        className={`mr-3 size-5 rounded border flex items-center justify-center transition-colors ${
                          allSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        }`}
                      >
                        {allSelected && <Check className="size-3 text-primary-foreground" />}
                      </button>
                    </div>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                        {categoryEvents.map((event) => (
                          <button
                            key={event}
                            onClick={() => toggleEvent(event)}
                            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                              selectedEvents.includes(event)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {event.replace(`${category}.`, '')}
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
