"use client"

import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ChatwootForm } from "@/components/integrations/chatwoot-form"
import { SyncSettings } from "@/components/integrations/sync-settings"

export default function ChatwootPage() {
  const [syncContacts, setSyncContacts] = useState(true)
  const [syncMessages, setSyncMessages] = useState(true)
  const [syncDays, setSyncDays] = useState(7)

  useEffect(() => {
    // TODO: Fetch Chatwoot config
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/integrations">Integrations</BreadcrumbLink>
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
            <ChatwootForm />
            <SyncSettings
              syncContacts={syncContacts}
              syncMessages={syncMessages}
              syncDays={syncDays}
              onSyncContactsChange={setSyncContacts}
              onSyncMessagesChange={setSyncMessages}
              onSyncDaysChange={setSyncDays}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
