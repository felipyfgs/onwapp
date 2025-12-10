"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserCircle,
  Image,
  Settings,
  Plug,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { SessionSwitcher } from "@/components/session-switcher"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function SessionSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const sessionId = params.id as string

  const user = {
    name: sessionId,
    email: "Sessão WhatsApp",
    avatar: "",
  }

  const navItems = [
    { title: "Visão Geral", url: `/sessions/${sessionId}`, icon: LayoutDashboard },
    { title: "Conversas", url: `/sessions/${sessionId}/chats`, icon: MessageSquare },
    { title: "Contatos", url: `/sessions/${sessionId}/contacts`, icon: UserCircle },
    { title: "Grupos", url: `/sessions/${sessionId}/groups`, icon: Users },
    { title: "Mídia", url: `/sessions/${sessionId}/media`, icon: Image },
  ]

  const configItems = [
    { title: "Configurações", url: `/sessions/${sessionId}/settings`, icon: Settings },
  ]

  const integrationItems = [
    { title: "Webhook", url: `/sessions/${sessionId}/webhook` },
    { title: "Chatwoot", url: `/sessions/${sessionId}/chatwoot` },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SessionSwitcher currentSessionId={sessionId} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Integrações">
                      <Plug />
                      <span>Integrações</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {integrationItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={item.url}>
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
