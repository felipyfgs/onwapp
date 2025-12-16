import { MessageCircle, Save, RefreshCw } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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

export default async function ChatwootPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
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
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>
                Configure your Chatwoot instance connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="url">Chatwoot URL</Label>
                  <Input
                    id="url"
                    placeholder="https://app.chatwoot.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">API Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Your API token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Account ID</Label>
                  <Input
                    id="account"
                    type="number"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inbox">Inbox ID</Label>
                  <Input
                    id="inbox"
                    type="number"
                    placeholder="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>
                Configure message synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync Contacts</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync WhatsApp contacts to Chatwoot
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync message history to Chatwoot
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="syncDays">Sync Days</Label>
                <Input
                  id="syncDays"
                  type="number"
                  placeholder="7"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Number of days to sync message history
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
