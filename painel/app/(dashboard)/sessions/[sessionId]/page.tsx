import { cookies } from "next/headers"
import { SessionDashboard } from "@/components/session"
import { type Session, type SessionStats } from "@/lib/api/sessions"

async function getSessionStatus(sessionId: string, apiKey: string): Promise<Session | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  
  try {
    const res = await fetch(`${apiUrl}/${sessionId}/status`, {
      headers: { 'Authorization': apiKey },
      cache: 'no-store',
    })
    
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getSessionProfile(sessionId: string, apiKey: string): Promise<{ pictureUrl?: string; pushName?: string } | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  
  try {
    const res = await fetch(`${apiUrl}/${sessionId}/profile`, {
      headers: { 'Authorization': apiKey },
      cache: 'no-store',
    })
    
    if (!res.ok) return null
    const data = await res.json()
    return data.profile || null
  } catch {
    return null
  }
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const cookieStore = await cookies()
  const apiKey = cookieStore.get('api_key')?.value || ''
  
  const session = await getSessionStatus(sessionId, apiKey)
  
  // Fetch profile picture from /profile endpoint when connected
  let profilePicture: string | undefined
  let pushName = session?.pushName
  if (session?.status === 'connected') {
    const profile = await getSessionProfile(sessionId, apiKey)
    if (profile?.pictureUrl) profilePicture = profile.pictureUrl
    if (profile?.pushName) pushName = profile.pushName
  }

  return (
    <SessionDashboard 
      sessionId={sessionId}
      initialStatus={session?.status || 'disconnected'}
      phone={session?.phone}
      pushName={pushName}
      profilePicture={profilePicture}
      stats={session?.stats}
      apiKey={session?.apiKey}
      createdAt={session?.createdAt}
    />
  )
}
