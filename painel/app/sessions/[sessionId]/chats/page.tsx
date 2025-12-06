"use client"

import { useParams } from "next/navigation"
import { SessionSidebar } from "@/components/sessions/session-sidebar"
import { AppHeader } from "@/components/app-header"
import { ChatsList } from "@/components/sessions/chats-list"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function ChatsPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <SidebarProvider>
      <SessionSidebar sessionId={sessionId} />
      <SidebarInset>
        <AppHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>
                  {sessionId}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Conversas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </AppHeader>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <ChatsList sessionId={sessionId} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
