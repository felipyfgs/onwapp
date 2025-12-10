"use client"

import { useEffect, useState, useCallback, use } from "react"
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
import { MessageSquare, Users, UserCircle, Plug, Webhook, Bot } from "lucide-react"
import {
  ApiSession,
  getSessionStatus,
  getChats,
  getContacts,
  getGroups,
  getWebhook,
} from "@/lib/api/sessions"
import {
  SessionProfileCard,
  SessionActions,
  StatCard,
  StatCardSkeleton,
  IntegrationStatCard,
  QuickAccessCard,
} from "@/components/session"

interface SessionDetailPageProps {
  params: Promise<{ id: string }>
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = use(params)

  const [session, setSession] = useState<ApiSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ chats: 0, contacts: 0, groups: 0, webhookEnabled: false })
  const [statsLoading, setStatsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      const data = await getSessionStatus(id)
      setSession(data)
    } catch (error) {
      console.error("Failed to fetch session:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const [chats, contacts, groups, webhook] = await Promise.all([
        getChats(id).catch(() => []),
        getContacts(id).catch(() => []),
        getGroups(id).catch(() => []),
        getWebhook(id).catch(() => null),
      ])
      setStats({
        chats: chats.length,
        contacts: contacts.length,
        groups: groups.length,
        webhookEnabled: webhook?.enabled ?? false,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSession()
    fetchStats()
  }, [fetchSession, fetchStats])

  const handleRefresh = () => {
    fetchSession()
    fetchStats()
  }

  const isConnected = session?.status === "connected"

  const quickLinks = [
    { title: "Conversas", href: `/sessions/${id}/chats`, icon: MessageSquare, count: stats.chats },
    { title: "Contatos", href: `/sessions/${id}/contacts`, icon: UserCircle, count: stats.contacts },
    { title: "Grupos", href: `/sessions/${id}/groups`, icon: Users, count: stats.groups },
  ]

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Profile Card */}
        <SessionProfileCard
          session={session}
          loading={loading}
          actions={
            <SessionActions
              sessionId={id}
              isConnected={isConnected}
              onAction={handleRefresh}
            />
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {statsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard title="Conversas" value={stats.chats} icon={MessageSquare} />
              <StatCard title="Contatos" value={stats.contacts} icon={UserCircle} />
              <StatCard title="Grupos" value={stats.groups} icon={Users} />
              <IntegrationStatCard
                title="Integrações"
                icon={Plug}
                integrations={[
                  { icon: Webhook, enabled: stats.webhookEnabled },
                  { icon: Bot, enabled: false },
                ]}
              />
            </>
          )}
        </div>

        {/* Quick Access */}
        <QuickAccessCard links={quickLinks} />
      </div>
    </>
  )
}
