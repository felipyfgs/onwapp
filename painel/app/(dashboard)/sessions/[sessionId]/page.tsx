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

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const cookieStore = await cookies()
  const apiKey = cookieStore.get('api_key')?.value || ''
  
  const session = await getSessionStatus(sessionId, apiKey)

  return (
    <SessionDashboard 
      sessionId={sessionId}
      initialStatus={session?.status || 'disconnected'}
      phone={session?.phone}
      pushName={session?.pushName}
      profilePicture={session?.profilePicture}
      stats={session?.stats}
      apiKey={session?.apiKey}
      createdAt={session?.createdAt}
    />
  )
}
