"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Webhook,
  MessageSquare,
  Puzzle,
  ScrollText,
  Settings,
  ChevronLeft,
  Smartphone,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

interface SessionSidebarProps {
  sessionId: string
}

const menuItems = [
  { title: "Overview", url: "", icon: LayoutDashboard },
  { title: "Webhooks", url: "/webhooks", icon: Webhook },
  { title: "Chatwoot", url: "/chatwoot", icon: MessageSquare },
  { title: "Integracoes", url: "/integrations", icon: Puzzle },
  { title: "Logs", url: "/logs", icon: ScrollText },
  { title: "Configuracoes", url: "/settings", icon: Settings },
]

export function SessionSidebar({ sessionId }: SessionSidebarProps) {
  const pathname = usePathname()
  const basePath = `/session/${sessionId}`

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <Smartphone className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="font-semibold truncate">{sessionId}</span>
            <span className="text-xs text-muted-foreground">Sessao</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const itemPath = `${basePath}${item.url}`
                const isActive = item.url === "" 
                  ? pathname === basePath 
                  : pathname.startsWith(itemPath)
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={itemPath}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
