import { Webhook, Save, TestTube } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default async function WebhookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const events = [
    { name: "message.received", label: "Message Received" },
    { name: "message.sent", label: "Message Sent" },
    { name: "message.delivered", label: "Message Delivered" },
    { name: "message.read", label: "Message Read" },
    { name: "session.connected", label: "Session Connected" },
    { name: "session.disconnected", label: "Session Disconnected" },
    { name: "session.qr", label: "QR Code Generated" },
  ]

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
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}/integrations`}>
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
          <div className="flex gap-2">
            <Button variant="outline">
              <TestTube className="mr-2 h-4 w-4" />
              Test Webhook
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure your webhook endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL</Label>
                <Input
                  id="url"
                  placeholder="https://your-server.com/webhook"
                />
                <p className="text-xs text-muted-foreground">
                  Events will be POSTed to this URL
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret">Secret (Optional)</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Your webhook secret"
                />
                <p className="text-xs text-muted-foreground">
                  Used to sign webhook payloads for verification
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                Select which events to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {events.map((event) => (
                  <div
                    key={event.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.name}
                      </p>
                    </div>
                    <Badge variant="outline">Disabled</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
