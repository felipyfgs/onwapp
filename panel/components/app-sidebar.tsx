"use client"

import * as React from "react"
import {
  Activity,
  BarChart3,
  BookOpen,
  Headphones,
  Home,
  Image,
  Mail,
  MessageSquare,
  Newspaper,
  Radio,
  Settings,
  Smartphone,
  User,
  Users,
  Webhook,
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

// OnWapp navigation data
const data = {
  user: {
    name: "Admin",
    email: "admin@onwapp.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "OnWapp",
      logo: MessageSquare,
      plan: "WhatsApp API",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
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
      ],
    },
    {
      title: "Sessions",
      url: "/sessions",
      icon: Smartphone,
      items: [
        {
          title: "All Sessions",
          url: "/sessions",
        },
        {
          title: "Create New",
          url: "/sessions/new",
        },
      ],
    },
    {
      title: "Messages",
      url: "#",
      icon: MessageSquare,
      items: [
        {
          title: "All Messages",
          url: "/messages",
        },
        {
          title: "Templates",
          url: "/messages/templates",
        },
      ],
    },
    {
      title: "Integrations",
      url: "#",
      icon: Webhook,
      items: [
        {
          title: "Webhooks",
          url: "/webhooks",
        },
        {
          title: "Chatwoot",
          url: "/integrations/chatwoot",
        },
        {
          title: "Events",
          url: "/events",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "/settings",
        },
        {
          title: "API Keys",
          url: "/settings/api-keys",
        },
        {
          title: "Storage",
          url: "/settings/storage",
        },
      ],
    },
  ],
  sessionFeatures: [
    {
      name: "Overview",
      url: "overview",
      icon: BarChart3,
    },
    {
      name: "Messages",
      url: "messages",
      icon: MessageSquare,
    },
    {
      name: "Contacts",
      url: "contacts",
      icon: Users,
    },
    {
      name: "Groups",
      url: "groups",
      icon: Users,
    },
    {
      name: "Profile",
      url: "profile",
      icon: User,
    },
    {
      name: "Media",
      url: "media",
      icon: Image,
    },
    {
      name: "Newsletter",
      url: "newsletter",
      icon: Newspaper,
    },
    {
      name: "Status",
      url: "status",
      icon: Radio,
    },
    {
      name: "Webhooks",
      url: "webhooks",
      icon: Webhook,
    },
    {
      name: "Chatwoot",
      url: "chatwoot",
      icon: Headphones,
    },
    {
      name: "Settings",
      url: "settings",
      icon: Settings,
    },
  ],
  resources: [
    {
      name: "Documentation",
      url: "/docs",
      icon: BookOpen,
    },
    {
      name: "API Reference",
      url: "/api-docs",
      icon: Activity,
    },
    {
      name: "Support",
      url: "/support",
      icon: Mail,
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
        <NavProjects projects={data.resources} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
