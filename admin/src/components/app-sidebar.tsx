"use client"

import * as React from "react"
import {
  MessageSquare,
  Users,
  Webhook,
  Settings,
  Smartphone,
  Mail,
  Shield,
  Database,
  Activity,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Dados do OnWapp Admin
const data = {
  user: {
    name: "Admin",
    email: "admin@onwapp.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "OnWapp",
      logo: Smartphone,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Sessões",
      url: "/sessions",
      icon: Smartphone,
      isActive: true,
      items: [
        {
          title: "Todas as Sessões",
          url: "/sessions",
        },
        {
          title: "Grupos",
          url: "/sessions/groups",
        },
        {
          title: "Mensagens",
          url: "/sessions/messages",
        },
      ],
    },
    {
      title: "Webhooks",
      url: "/webhooks",
      icon: Webhook,
      items: [
        {
          title: "Configurar",
          url: "/webhooks",
        },
        {
          title: "Logs",
          url: "/webhooks/logs",
        },
      ],
    },
    {
      title: "Chatwoot",
      url: "/chatwoot",
      icon: Shield,
      items: [
        {
          title: "Configuração",
          url: "/chatwoot",
        },
        {
          title: "Sincronização",
          url: "/chatwoot/sync",
        },
        {
          title: "Conversas",
          url: "/chatwoot/conversations",
        },
      ],
    },
    {
      title: "Configurações",
      url: "/settings",
      icon: Settings,
      items: [
        {
          title: "Geral",
          url: "/settings",
        },
        {
          title: "API",
          url: "/settings/api",
        },
        {
          title: "Segurança",
          url: "/settings/security",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Atividade",
      url: "/activity",
      icon: Activity,
    },
    {
      name: "Logs",
      url: "/logs",
      icon: Database,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
