"use client"

import * as React from "react"
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
  
  // Avoid hydration mismatch by rendering sidebar only on client
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <SidebarProvider>
      {mounted && <SessionSidebar sessionId={sessionId} />}
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
