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
  MessageSquare,
  PieChart,
  Settings2,
  SquareTerminal,
  Smartphone,
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

// This is sample data.
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
      items: [
        {
          title: "All Sessions",
          url: "/sessions",
        },
      ],
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "API Keys",
          url: "#",
        },
      ],
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
