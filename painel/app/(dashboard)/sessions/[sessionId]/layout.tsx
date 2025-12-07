import { cookies } from "next/headers"
import { AppSidebar, SessionItem } from "@/components/sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

async function getSessions(apiKey: string): Promise<SessionItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  
  try {
    const res = await fetch(`${apiUrl}/sessions`, {
      headers: { 'Authorization': apiKey },
      cache: 'no-store',
    })
    
    if (!res.ok) return []
    
    const data = await res.json()
    // API retorna array direto, não { sessions: [] }
    const sessions = Array.isArray(data) ? data : []
    return sessions.map((s: { id: string; session: string; status: string; phone?: string }) => ({
      id: s.id,
      name: s.session,
      status: s.status as SessionItem['status'],
      phone: s.phone,
    }))
  } catch {
    return []
  }
}

export default async function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const cookieStore = await cookies()
  const apiKey = cookieStore.get('api_key')?.value || ''
  const sessions = await getSessions(apiKey)

  return (
    <SidebarProvider>
      <AppSidebar sessions={sessions} currentSessionId={sessionId} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
