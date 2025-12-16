"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { MessageCircle } from "lucide-react"

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
import { ChatwootForm } from "@/components/integrations/chatwoot-form"
import { SyncSettings } from "@/components/integrations/sync-settings"
import { getChatwootConfig, setChatwootConfig } from "@/lib/api/chatwoot"

export default function ChatwootPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [syncContacts, setSyncContacts] = useState(true)
  const [syncMessages, setSyncMessages] = useState(true)
  const [syncDays, setSyncDays] = useState(7)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const config = await getChatwootConfig(sessionId)
        if (config) {
          setSyncContacts(config.syncContacts ?? true)
          setSyncMessages(config.syncMessages ?? true)
          setSyncDays(config.syncDays ?? 7)
        }
      } catch (err) {
        console.error("Failed to load config:", err)
      }
    }
    fetchConfig()
  }, [sessionId])

  const handleSyncContactsChange = async (value: boolean) => {
    setSyncContacts(value)
    try {
      await setChatwootConfig(sessionId, { syncContacts: value })
    } catch (err) {
      console.error("Failed to update sync contacts:", err)
    }
  }

  const handleSyncMessagesChange = async (value: boolean) => {
    setSyncMessages(value)
    try {
      await setChatwootConfig(sessionId, { syncMessages: value })
    } catch (err) {
      console.error("Failed to update sync messages:", err)
    }
  }

  const handleSyncDaysChange = async (value: number) => {
    setSyncDays(value)
    try {
      await setChatwootConfig(sessionId, { syncDays: value })
    } catch (err) {
      console.error("Failed to update sync days:", err)
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
                <BreadcrumbPage>Chatwoot</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-semibold">Chatwoot Integration</h1>
              <p className="text-sm text-muted-foreground">
                Configure Chatwoot for customer support
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <ChatwootForm sessionId={sessionId} />
          <SyncSettings
            sessionId={sessionId}
            syncContacts={syncContacts}
            syncMessages={syncMessages}
            syncDays={syncDays}
            onSyncContactsChange={handleSyncContactsChange}
            onSyncMessagesChange={handleSyncMessagesChange}
            onSyncDaysChange={handleSyncDaysChange}
          />
        </div>
      </div>
    </>
  )
}
