import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SessionSidebar } from "@/components/layout"

interface SessionLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function SessionLayout({ children, params }: SessionLayoutProps) {
  const { id } = await params

  return (
    <SidebarProvider>
      <SessionSidebar sessionId={id} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
