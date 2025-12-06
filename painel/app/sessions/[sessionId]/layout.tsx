"use client"

import { SessionSidebar } from "@/components/sessions/session-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useParams } from "next/navigation"

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <SidebarProvider>
      <SessionSidebar sessionId={sessionId} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
