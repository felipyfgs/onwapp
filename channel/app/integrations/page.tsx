"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Webhook, MessageCircle, CheckCircle, XCircle } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function IntegrationsPage() {
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [chatwootEnabled, setChatwootEnabled] = useState(false)

  useEffect(() => {
    // TODO: Fetch integration status
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
                <BreadcrumbItem>
                  <BreadcrumbPage>Integrations</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Integrations</h1>
              <p className="text-sm text-muted-foreground">
                Connect external services to your application
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <CardTitle>Chatwoot</CardTitle>
                  </div>
                  {chatwootEnabled ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Disabled
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Connect to Chatwoot for customer support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sync your WhatsApp messages with Chatwoot to manage customer conversations in one place.
                </p>
                <Button asChild>
                  <Link href="/integrations/chatwoot">Configure</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    <CardTitle>Webhook</CardTitle>
                  </div>
                  {webhookEnabled ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Disabled
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Receive real-time event notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure webhooks to receive events like new messages, status updates, and more.
                </p>
                <Button asChild>
                  <Link href="/integrations/webhook">Configure</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
