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
import { getSessions, Session } from "@/lib/api"

const staticData = {
  user: {
    name: "Admin",
    email: "admin@onwapp.io",
    avatar: "",
  },
  teams: [
    {
      name: "OnWApp",
      logo: MessageSquare,
      plan: "WhatsApp API",
    },
  ],
  projects: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [sessions, setSessions] = React.useState<Session[]>([])

  React.useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
  }, [])

  const navMain = React.useMemo(() => {
    const activeSession = sessions.find((s) => s.status === "connected") || sessions[0]
    const sessionId = activeSession?.session
    const baseUrl = sessionId ? `/sessions/${sessionId}` : "/sessions"

    return [
      {
        title: "Sessions",
        url: "/sessions",
        icon: Smartphone,
        isActive: true,
      },
      {
        title: "Overview",
        url: baseUrl,
        icon: Smartphone,
        disabled: !sessionId,
      },
      {
        title: "Chats",
        url: `${baseUrl}/chats`,
        icon: MessagesSquare,
        disabled: !sessionId,
      },
      {
        title: "Contacts",
        url: `${baseUrl}/contacts`,
        icon: Users,
        disabled: !sessionId,
      },
      {
        title: "Groups",
        url: `${baseUrl}/groups`,
        icon: UsersRound,
        disabled: !sessionId,
      },
      {
        title: "Messages",
        url: `${baseUrl}/messages`,
        icon: Send,
        disabled: !sessionId,
      },
      {
        title: "Media",
        url: `${baseUrl}/media`,
        icon: Image,
        disabled: !sessionId,
      },
      {
        title: "Integrations",
        url: "#",
        icon: Webhook,
        items: [
          { title: "Webhooks", url: `${baseUrl}/webhooks` },
          { title: "Chatwoot", url: `${baseUrl}/chatwoot` },
        ],
      },
      {
        title: "Settings",
        url: `${baseUrl}/settings`,
        icon: Settings2,
        disabled: !sessionId,
      },
    ]
  }, [sessions])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={staticData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={staticData.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={staticData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
