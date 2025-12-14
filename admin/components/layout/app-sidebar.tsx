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
    const overviewUrl = activeSession ? `/sessions/${activeSession.session}` : "/sessions"

    return [
      {
        title: "Overview",
        url: overviewUrl,
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
        url: "#",
        icon: Webhook,
        items: [
          { title: "Webhooks", url: "/webhooks" },
          { title: "Chatwoot", url: "/chatwoot" },
        ],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings2,
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
