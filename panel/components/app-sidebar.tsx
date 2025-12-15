"use client"

import * as React from "react"
import {
  Activity,
  BarChart3,
  BookOpen,
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sessionId?: string
}

function getNavigationData(sessionId?: string) {
  // If sessionId is provided, use session-specific navigation
  if (sessionId) {
    const baseUrl = `/sessions/${sessionId}`
    return {
      user: {
        name: "Admin",
        email: "admin@onwapp.com",
        avatar: "/avatars/admin.jpg",
      },
      teams: [
        {
          name: "OnWapp",
          logo: MessageSquare,
          plan: sessionId,
        },
      ],
      navMain: [
        {
          title: "Overview",
          url: baseUrl,
          icon: BarChart3,
          isActive: true,
        },
        {
          title: "Messages",
          url: `${baseUrl}/messages`,
          icon: MessageSquare,
        },
        {
          title: "Contacts",
          url: `${baseUrl}/contacts`,
          icon: Users,
        },
        {
          title: "Groups",
          url: `${baseUrl}/groups`,
          icon: Users,
        },
        {
          title: "Profile",
          url: `${baseUrl}/profile`,
          icon: User,
        },
        {
          title: "Media",
          url: `${baseUrl}/media`,
          icon: Image,
        },
        {
          title: "Newsletter",
          url: `${baseUrl}/newsletter`,
          icon: Newspaper,
        },
        {
          title: "Status",
          url: `${baseUrl}/status`,
          icon: Radio,
        },
        {
          title: "Integrations",
          url: `${baseUrl}/integrations`,
          icon: Webhook,
          items: [
            {
              title: "Webhooks",
              url: `${baseUrl}/integrations/webhooks`,
            },
            {
              title: "Chatwoot",
              url: `${baseUrl}/integrations/chatwoot`,
            },
          ],
        },
        {
          title: "Settings",
          url: `${baseUrl}/settings`,
          icon: Settings,
        },
      ],
      resources: [
        {
          name: "All Sessions",
          url: "/sessions",
          icon: MessageSquare,
        },
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
  }

  // Default global navigation (for dashboard, etc)
  return {
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
        url: "/messages",
        icon: MessageSquare,
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
}

export function AppSidebar({ sessionId, ...props }: AppSidebarProps) {
  const data = getNavigationData(sessionId)

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
