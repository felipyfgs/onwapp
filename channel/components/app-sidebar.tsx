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
  Smartphone,
  Send,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
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
    },
    {
      title: "Sessions",
      url: "/sessions",
      icon: Smartphone,
    },
    {
      title: "Chats",
      url: "/chats",
      icon: MessageSquare,
    },
    {
      title: "Messages",
      url: "/messages",
      icon: Send,
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: Users,
    },
    {
      title: "Groups",
      url: "/groups",
      icon: UsersRound,
    },
    {
      title: "Media",
      url: "/media",
      icon: Image,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: UserCircle,
    },
    {
      title: "Integrations",
      url: "/integrations",
      icon: Webhook,
      items: [
        { title: "Overview", url: "/integrations" },
        { title: "Chatwoot", url: "/integrations/chatwoot" },
        { title: "Webhook", url: "/integrations/webhook" },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
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
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
