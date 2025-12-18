"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  Map,
  Settings2,
  SquareTerminal,
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

// Dados reais do sistema
const data = {
  user: {
    name: "Admin User",
    email: "admin@onwapp.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "ONWApp",
      logo: GalleryVerticalEnd,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
        {
          title: "Reports",
          url: "/dashboard/reports",
        },
      ],
    },
    {
      title: "Chats",
      url: "/dashboard/chats",
      icon: Bot,
      items: [
        {
          title: "All Chats",
          url: "/dashboard/chats",
        },
        {
          title: "Active",
          url: "/dashboard/chats/active",
        },
        {
          title: "Archived",
          url: "/dashboard/chats/archived",
        },
      ],
    },
    {
      title: "Connections",
      url: "/dashboard/connections",
      icon: Settings2,
      items: [
        {
          title: "All Connections",
          url: "/dashboard/connections",
        },
        {
          title: "API Keys",
          url: "/dashboard/connections/api",
        },
        {
          title: "Webhooks",
          url: "/dashboard/connections/webhooks",
        },
      ],
    },
    {
      title: "Contacts",
      url: "/dashboard/contacts",
      icon: BookOpen,
      items: [
        {
          title: "All Contacts",
          url: "/dashboard/contacts",
        },
        {
          title: "Groups",
          url: "/dashboard/contacts/groups",
        },
        {
          title: "Import",
          url: "/dashboard/contacts/import",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
    },
    {
      name: "Help Center",
      url: "/dashboard/help",
      icon: BookOpen,
    },
    {
      name: "Profile",
      url: "/dashboard/profile",
      icon: Map,
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
