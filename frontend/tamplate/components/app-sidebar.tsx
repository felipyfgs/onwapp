"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  MessageSquare,
  Users,
  Activity,
  Clock,
  Smartphone,
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

// Dados reais para o Onwapp
const data = {
  user: {
    name: "Usuário",
    email: "usuario@onwapp.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "Onwapp",
      logo: GalleryVerticalEnd,
      plan: "Multi-tenant",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Chats",
      url: "/dashboard/chats",
      icon: MessageSquare,
      items: [
        {
          title: "Ativos",
          url: "/dashboard/chats",
        },
        {
          title: "Histórico",
          url: "/dashboard/chats/history",
        },
      ],
    },
    {
      title: "Contatos",
      url: "/dashboard/contacts",
      icon: Users,
      items: [
        {
          title: "Lista",
          url: "/dashboard/contacts",
        },
        {
          title: "Grupos",
          url: "/dashboard/contacts/groups",
        },
      ],
    },
    {
      title: "Conexões",
      url: "/dashboard/connections",
      icon: Activity,
      items: [
        {
          title: "Sessões",
          url: "/dashboard/connections",
        },
        {
          title: "QR Codes",
          url: "/dashboard/connections/qr",
        },
      ],
    },
    {
      title: "Filas",
      url: "/dashboard/queues",
      icon: Clock,
      items: [
        {
          title: "Gerenciar",
          url: "/dashboard/queues",
        },
        {
          title: "Distribuição",
          url: "/dashboard/queues/distribution",
        },
      ],
    },
    {
      title: "Configurações",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "Perfil",
          url: "/dashboard/settings",
        },
        {
          title: "Segurança",
          url: "/dashboard/settings/security",
        },
        {
          title: "Sistema",
          url: "/dashboard/settings/system",
        },
      ],
    },
  ],
  projects: [
    {
      name: "WhatsApp",
      url: "/dashboard/connections",
      icon: Smartphone,
    },
    {
      name: "Relatórios",
      url: "/dashboard/reports",
      icon: PieChart,
    },
    {
      name: "Templates",
      url: "/dashboard/templates",
      icon: BookOpen,
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
