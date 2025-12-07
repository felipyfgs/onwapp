"use client"

import { useState, useEffect, use } from "react"
import { Loader2, Trash2, Save } from "lucide-react"
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
import { WebhookConfigCard, EventsCard, WebhookSkeleton } from "@/components/webhooks"
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
      } catch {
        // Silent error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const handleSave = async () => {
    if (!url) return
    
    setSaving(true)
    try {
      const data = await setWebhook(sessionId, {
        url,
        events: selectedEvents,
        enabled,
        secret: secret || undefined,
      })
      setWebhookState(data)
    } catch {
      // Silent error
    } finally {
      setSaving(false)
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
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
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
    setSelectedEvents(prev => 
      allSelected
        ? prev.filter(e => !categoryEvents.includes(e))
        : [...new Set([...prev, ...categoryEvents])]
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
        <WebhookSkeleton />
      </>
    )
  }

  const totalEvents = events?.all?.length || 0

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

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Webhook</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !url}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              <span className="ml-1.5">Salvar</span>
            </Button>
            {webhook && (
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={saving} className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <WebhookConfigCard
          url={url}
          secret={secret}
          enabled={enabled}
          onUrlChange={setUrl}
          onSecretChange={setSecret}
          onEnabledChange={setEnabled}
        />

        {events?.categories && (
          <EventsCard
            categories={events.categories}
            selectedEvents={selectedEvents}
            openCategories={openCategories}
            onToggleCategory={toggleCategory}
            onToggleEvent={toggleEvent}
            onToggleAllInCategory={toggleAllInCategory}
            onSelectAll={selectAllEvents}
            onClearAll={clearAllEvents}
            totalEvents={totalEvents}
          />
        )}
      </div>
    </>
  )
}
