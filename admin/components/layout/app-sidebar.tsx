"use client"

import * as React from "react"
import {
  MessageSquare,
  Settings2,
  Smartphone,
  Users,
  MessagesSquare,
  Image,
  Webhook,
  UsersRound,
  Send,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
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
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "OnWApp",
      logo: MessageSquare,
      plan: "WhatsApp API",
    },
  ],
  navMain: [
    {
      title: "Sessions",
      url: "/sessions",
      icon: Smartphone,
      isActive: true,
    },
    {
      title: "Chats",
      url: "/chats",
      icon: MessagesSquare,
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
      title: "Messages",
      url: "/messages",
      icon: Send,
    },
    {
      title: "Media",
      url: "/media",
      icon: Image,
    },
    {
      title: "Integrations",
      url: "/integrations",
      icon: Webhook,
      items: [
        { title: "Webhooks", url: "/webhooks" },
        { title: "Chatwoot", url: "/integrations/chatwoot" },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
  projects: [],
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
