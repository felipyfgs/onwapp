'use client'

import { use } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SessionSidebar } from '@/components/session-sidebar'
import { SessionHeader } from '@/components/session-header'

export default function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ name: string }>
}) {
  const { name } = use(params)

  return (
    <SidebarProvider>
      <SessionSidebar sessionName={name} />
      <SidebarInset>
        <SessionHeader sessionName={name} />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
