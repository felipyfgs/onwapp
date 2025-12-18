"use client"

import * as React from "react"
import {
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  MessageSquare,
  Users,
  Activity,
  Clock,
  Smartphone,
  BookOpen,
} from "lucide-react"

import { NavMain } from "@/components/navigation/nav-main"
import { NavProjects } from "@/components/navigation/nav-projects"
import { NavUser } from "@/components/navigation/nav-user"
import { TeamSwitcher } from "@/components/navigation/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Dados reais do sistema Onwapp
const data = {
  user: {
    name: "Usuário",
    email: "usuario@onwapp.com",
    avatar: "/avatar.jpg",
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
    },
    {
      title: "Contatos",
      url: "/dashboard/contacts",
      icon: Users,
    },
    {
      title: "Conexões",
      url: "/dashboard/connections",
      icon: Activity,
    },
    {
      title: "Filas",
      url: "/dashboard/queues",
      icon: Clock,
    },
    {
      title: "Configurações",
      url: "/dashboard/settings",
      icon: Settings2,
    },
  ],
  projects: [
    {
      name: "WhatsApp",
      url: "/dashboard/connections",
      icon: Smartphone,
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
