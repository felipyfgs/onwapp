'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome,
  IconMessage,
  IconUsers,
  IconSettings,
  IconQrcode,
  IconWebhook,
  IconPhoto,
  IconHistory,
} from '@tabler/icons-react'

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
  SidebarRail,
} from '@/components/ui/sidebar'

interface SessionSidebarProps {
  sessionName: string
}

export function SessionSidebar({ sessionName }: SessionSidebarProps) {
  const pathname = usePathname()
  const basePath = `/session/${sessionName}`

  const mainNav = [
    { title: 'Overview', url: basePath, icon: IconHome },
    { title: 'QR Code', url: `${basePath}/qr`, icon: IconQrcode },
    { title: 'Mensagens', url: `${basePath}/messages`, icon: IconMessage },
    { title: 'Contatos', url: `${basePath}/contacts`, icon: IconUsers },
    { title: 'Grupos', url: `${basePath}/groups`, icon: IconUsers },
    { title: 'Midia', url: `${basePath}/media`, icon: IconPhoto },
    { title: 'Historico', url: `${basePath}/history`, icon: IconHistory },
  ]

  const settingsNav = [
    { title: 'Webhook', url: `${basePath}/webhook`, icon: IconWebhook },
    { title: 'Configuracoes', url: `${basePath}/settings`, icon: IconSettings },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="font-bold text-sm">ZP</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">zpwoot</span>
                  <span className="text-xs text-muted-foreground">{sessionName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sessao</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
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
          <SidebarGroupLabel>Configuracoes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
