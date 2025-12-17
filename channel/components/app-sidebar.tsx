"use client"

import * as React from "react"
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UsersRound,
  Image,
  UserCircle,
  Settings2,
  Webhook,
  MessageCircle,
  Smartphone,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { SessionSwitcher } from "@/components/session-switcher"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const globalData = {
  user: {
    name: "Admin",
    email: "admin@onwapp.io",
    avatar: "",
  },
  teams: [
    {
      name: "OnWapp",
      logo: Smartphone,
      plan: "WhatsApp API",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Sessions",
      url: "/sessions",
      icon: Smartphone,
    },
  ],
}

function getSessionNavItems(sessionId: string) {
  return [
    {
      title: "Overview",
      url: `/sessions/${sessionId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Chats",
      url: `/sessions/${sessionId}/chats`,
      icon: MessageSquare,
    },
    {
      title: "Contacts",
      url: `/sessions/${sessionId}/contacts`,
      icon: Users,
    },
    {
      title: "Groups",
      url: `/sessions/${sessionId}/groups`,
      icon: UsersRound,
    },
    {
      title: "Media",
      url: `/sessions/${sessionId}/media`,
      icon: Image,
    },
    {
      title: "Profile",
      url: `/sessions/${sessionId}/profile`,
      icon: UserCircle,
    },
    {
      title: "Settings",
      url: `/sessions/${sessionId}/settings`,
      icon: Settings2,
      items: [
        { title: "General", url: `/sessions/${sessionId}/settings` },
        { title: "Integrations", url: `/sessions/${sessionId}/integrations` },
      ],
    },
    {
      title: "Integrations",
      url: `/sessions/${sessionId}/integrations`,
      icon: Webhook,
      items: [
        { title: "Overview", url: `/sessions/${sessionId}/integrations` },
        { title: "Chatwoot", url: `/sessions/${sessionId}/integrations/chatwoot` },
        { title: "Webhook", url: `/sessions/${sessionId}/integrations/webhook` },
      ],
    },
  ]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sessionId?: string
}

export function AppSidebar({ sessionId, ...props }: AppSidebarProps) {
  const navItems = sessionId
    ? getSessionNavItems(sessionId)
    : globalData.navMain

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {sessionId ? (
          <SessionSwitcher sessionId={sessionId} />
        ) : (
          <TeamSwitcher teams={globalData.teams} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={globalData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
