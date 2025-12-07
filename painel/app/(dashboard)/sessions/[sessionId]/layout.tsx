import { cookies } from "next/headers"
import { AppSidebar, SessionItem } from "@/components/sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface SessionData {
  id: string
  session: string
  status: string
  phone?: string
}

async function getSessionProfile(apiUrl: string, sessionName: string, apiKey: string) {
  try {
    const res = await fetch(`${apiUrl}/${sessionName}/profile`, {
      headers: { 'Authorization': apiKey },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.profile || data
  } catch {
    return null
  }
}

async function getSessions(apiKey: string): Promise<SessionItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  
  try {
    const res = await fetch(`${apiUrl}/sessions`, {
      headers: { 'Authorization': apiKey },
      cache: 'no-store',
    })
    
    if (!res.ok) return []
    
    const data = await res.json()
    const sessions: SessionData[] = Array.isArray(data) ? data : []
    
    // Fetch profiles for connected sessions in parallel
    const sessionsWithProfiles = await Promise.all(
      sessions.map(async (s) => {
        let pushName: string | undefined
        let profilePicture: string | undefined
        
        if (s.status === 'connected') {
          const profile = await getSessionProfile(apiUrl, s.session, apiKey)
          if (profile) {
            pushName = profile.pushName
            profilePicture = profile.pictureUrl
          }
        }
        
        return {
          id: s.id,
          name: s.session,
          status: s.status as SessionItem['status'],
          phone: s.phone,
          pushName,
          profilePicture,
        }
      })
    )
    
    return sessionsWithProfiles
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
