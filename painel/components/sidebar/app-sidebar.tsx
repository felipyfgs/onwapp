"use client"

import * as React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UsersRound,
  Settings,
  Webhook,
  ArrowLeft,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { SessionSwitcher, SessionItem } from "./session-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sessions: SessionItem[]
  currentSessionId: string
}

export function AppSidebar({ 
  sessions, 
  currentSessionId,
  ...props 
}: AppSidebarProps) {
  const navItems = [
    {
      title: "Dashboard",
      url: `/sessions/${currentSessionId}`,
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Conversas",
      url: `/sessions/${currentSessionId}/chats`,
      icon: MessageSquare,
    },
    {
      title: "Contatos",
      url: `/sessions/${currentSessionId}/contacts`,
      icon: Users,
    },
    {
      title: "Grupos",
      url: `/sessions/${currentSessionId}/groups`,
      icon: UsersRound,
    },
    {
      title: "Integracoes",
      url: `/sessions/${currentSessionId}/integrations`,
      icon: Webhook,
      items: [
        {
          title: "Webhooks",
          url: `/sessions/${currentSessionId}/integrations/webhooks`,
        },
        {
          title: "Chatwoot",
          url: `/sessions/${currentSessionId}/integrations/chatwoot`,
        },
      ],
    },
    {
      title: "Configuracoes",
      url: `/sessions/${currentSessionId}/settings`,
      icon: Settings,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SessionSwitcher
          sessions={sessions}
          currentSessionId={currentSessionId}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/sessions">
                    <ArrowLeft />
                    <span>Voltar para Sessoes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavUser user={{ name: "Admin", email: "", avatar: "" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
