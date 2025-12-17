"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Activity, QrCode, Power, PowerOff, RefreshCw, LogOut } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SessionStats } from "@/components/overview/session-stats"
import { QuickActions } from "@/components/overview/quick-actions"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { ModeToggle } from "@/components/mode-toggle"
import { getSession } from "@/lib/api/sessions"
import { getChats } from "@/lib/api/chats"
import { getContacts } from "@/lib/api/contacts"
import { getGroups } from "@/lib/api/groups"
import { connectSession, disconnectSession, logoutSession, restartSession } from "@/lib/api/sessions"

export default function SessionOverviewPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<{
    session: string
    status: "connected" | "connecting" | "disconnected"
    pushName?: string
    phone?: string
    createdAt?: string
    profilePictureUrl?: string
  } | null>(null)
  const [stats, setStats] = useState({
    chats: 0,
    contacts: 0,
    groups: 0,
    media: 0,
  })
  const [loading, setLoading] = useState(true)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const sessionRes = await getSession(sessionId).catch(() => ({ success: false, data: null }))
      
      if (sessionRes.success && sessionRes.data) {
        setSession(sessionRes.data)
        
        if (sessionRes.data.status === "connected") {
          const [chatsRes, contactsRes, groupsRes] = await Promise.all([
            getChats(sessionId).catch(() => ({ success: false, data: [] })),
            getContacts(sessionId).catch(() => ({ success: false, data: [] })),
            getGroups(sessionId).catch(() => ({ success: false, data: [] })),
          ])
          
          setStats({
            chats: chatsRes.data?.length || 0,
            contacts: contactsRes.data?.length || 0,
            groups: groupsRes.data?.length || 0,
            media: 0,
          })
        } else {
          setStats({ chats: 0, contacts: 0, groups: 0, media: 0 })
        }
      }
    } catch (err) {
      console.error("Failed to fetch session data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [sessionId])

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
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{sessionId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto flex items-center gap-2 px-4">
          <ModeToggle />
          {session?.status === "connected" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQrDialogOpen(true)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted">
                {session?.profilePictureUrl ? (
                  <img
                    src={session.profilePictureUrl}
                    alt={session.pushName || sessionId}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium text-muted-foreground">
                    {(session?.pushName || sessionId).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {session?.pushName || sessionId}
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {session?.phone || "Not connected"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 $
                  session?.status === "connected"
                    ? "text-green-500"
                    : session?.status === "connecting"
                    ? "text-yellow-500"
                    : "text-muted-foreground"
                }`} />
                <span className="text-sm font-medium capitalize">
                  {session?.status || "Disconnected"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <QuickActions
            sessionId={sessionId}
            sessionName={session?.session || sessionId}
            status={session?.status || "disconnected"}
            onStatusChange={fetchData}
          />

          <Card>
            <CardHeader>
              <CardTitle>Session Info</CardTitle>
              <CardDescription>Details about this session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <Activity className={`h-4 w-4 ${
                    session?.status === "connected"
                      ? "text-green-500"
                      : session?.status === "connecting"
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  }`} />
                  <span className="text-sm font-medium capitalize">
                    {session?.status || "Disconnected"}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Session ID</span>
                <span className="text-sm font-medium">{sessionId}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">
                  {session?.pushName || "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm font-medium">
                  {session?.phone || "Not connected"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <SessionStats
          chatsCount={stats.chats}
          contactsCount={stats.contacts}
          groupsCount={stats.groups}
          mediaCount={stats.media}
          loading={loading}
        />
      </div>

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        sessionId={sessionId}
        onConnected={() => {
          setQrDialogOpen(false)
          fetchData()
        }}
      />
    </>
  )
}
