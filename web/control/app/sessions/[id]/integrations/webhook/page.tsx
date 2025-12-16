"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Webhook } from "lucide-react"

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
import { WebhookForm } from "@/components/integrations/webhook-form"
import { EventSelector } from "@/components/integrations/event-selector"
import { getWebhook, setWebhook } from "@/lib/api/webhook"

export default function WebhookPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [events, setEvents] = useState<string[]>([])

  useEffect(() => {
    async function fetchWebhook() {
      try {
        const webhook = await getWebhook(sessionId)
        if (webhook?.events) {
          setEvents(webhook.events)
        }
      } catch (err) {
        console.error("Failed to load webhook:", err)
      }
    }
    fetchWebhook()
  }, [sessionId])

  const handleEventsChange = async (newEvents: string[]) => {
    setEvents(newEvents)
    try {
      await setWebhook(sessionId, { events: newEvents })
    } catch (err) {
      console.error("Failed to update events:", err)
    }
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
                <BreadcrumbLink href="/sessions">Sessions</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}/integrations`}>
                  Integrations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Webhook</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Webhook className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-semibold">Webhook Integration</h1>
              <p className="text-sm text-muted-foreground">
                Receive real-time event notifications
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <WebhookForm sessionId={sessionId} />
          <EventSelector selectedEvents={events} onChange={handleEventsChange} />
        </div>
      </div>
    </>
  )
}
