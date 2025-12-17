import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <SidebarProvider>
      <AppSidebar sessionId={id} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
