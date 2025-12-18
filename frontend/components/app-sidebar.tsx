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
    },
    {
      title: "Chats",
      url: "/dashboard/chats",
      icon: Bot,
    },
    {
      title: "Connections",
      url: "/dashboard/connections",
      icon: Settings2,
    },
    {
      title: "Contacts",
      url: "/dashboard/contacts",
      icon: BookOpen,
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
