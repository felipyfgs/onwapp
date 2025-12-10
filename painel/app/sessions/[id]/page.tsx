"use client"

import { useEffect, useState, useCallback, use } from "react"
import Link from "next/link"
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
import {
  MessageSquare,
  Users,
  UserCircle,
  Plug,
  Webhook,
  Bot,
  Settings,
  ChevronRight,
  Image,
} from "lucide-react"
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
    { title: "Conversas", href: `/sessions/${id}/chats`, icon: MessageSquare, count: stats.chats, description: "Ver todas as conversas" },
    { title: "Contatos", href: `/sessions/${id}/contacts`, icon: UserCircle, count: stats.contacts, description: "Gerenciar contatos" },
    { title: "Grupos", href: `/sessions/${id}/groups`, icon: Users, count: stats.groups, description: "Ver grupos participantes" },
    { title: "Mídia", href: `/sessions/${id}/media`, icon: Image, description: "Fotos, vídeos e documentos" },
    { title: "Webhook", href: `/sessions/${id}/webhook`, icon: Webhook, description: "Configurar webhooks" },
    { title: "Configurações", href: `/sessions/${id}/settings`, icon: Settings, description: "Ajustes da sessão" },
  ]

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
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

      <div className="flex flex-1 flex-col gap-6 p-6">
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

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
                title="integração"
                icon={Plug}
                integrations={[
                  { icon: Webhook, enabled: stats.webhookEnabled, label: "Webhook" },
                  { icon: Bot, enabled: false, label: "Chatwoot" },
                ]}
              />
            </>
          )}
        </div>

        {/* Quick Access */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Acesso Rápido</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-muted group-hover:bg-background transition-colors">
                      <link.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {link.count !== undefined && (
                      <span className="text-lg font-semibold text-muted-foreground">{link.count}</span>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
