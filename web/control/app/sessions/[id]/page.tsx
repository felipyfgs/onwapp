"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Activity, ArrowLeft, QrCode } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SessionStats } from "@/components/overview/session-stats"
import { QuickActions } from "@/components/overview/quick-actions"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { ModeToggle } from "@/components/mode-toggle"
import { getSession } from "@/lib/api/sessions"
import { getChats } from "@/lib/api/chats"
import { getContacts } from "@/lib/api/contacts"
import { getGroups } from "@/lib/api/groups"

export default function SessionOverviewPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<{
    session: string
    status: "connected" | "connecting" | "disconnected"
    pushName?: string
    phone?: string
    createdAt?: string
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/sessions">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-base font-semibold tracking-tight">{sessionId}</h1>
              <p className="text-xs text-muted-foreground">
                {session?.pushName || "WhatsApp Session"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {session?.status === "connected" && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8"
                onClick={() => setQrDialogOpen(true)}
              >
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 space-y-4">
        <SessionStats
          chatsCount={stats.chats}
          contactsCount={stats.contacts}
          groupsCount={stats.groups}
          mediaCount={stats.media}
          loading={loading}
        />

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

        <QRCodeDialog
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
          sessionId={sessionId}
          onConnected={() => {
            setQrDialogOpen(false)
            fetchData()
          }}
        />
      </main>
    </div>
  )
}
