"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Activity } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SessionStats } from "@/components/overview/session-stats"
import { QuickActions } from "@/components/overview/quick-actions"
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

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sessionData, chatsData, contactsData, groupsData] = await Promise.all([
        getSession(sessionId).catch(() => null),
        getChats(sessionId).catch(() => []),
        getContacts(sessionId).catch(() => []),
        getGroups(sessionId).catch(() => []),
      ])

      if (sessionData) {
        setSession(sessionData)
      }
      setStats({
        chats: chatsData.length,
        contacts: contactsData.length,
        groups: groupsData.length,
        media: 0,
      })
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
                <BreadcrumbLink href="/sessions">Sessions</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{sessionId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Session Overview</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage your WhatsApp session
            </p>
          </div>
        </div>

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
      </div>
    </>
  )
}
