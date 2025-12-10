"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { ApiSession, getSessionById } from "@/lib/api/sessions"

interface SessionContextType {
  session: ApiSession | null
  sessionName: string | null
  loading: boolean
  error: string | null
  refresh: () => void
}

const SessionContext = createContext<SessionContextType | null>(null)

export function SessionProvider({ 
  sessionId, 
  children 
}: { 
  sessionId: string
  children: ReactNode 
}) {
  const [session, setSession] = useState<ApiSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSessionById(sessionId)
      setSession(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session")
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId, fetchSession])

  return (
    <SessionContext.Provider 
      value={{ 
        session, 
        sessionName: session?.session ?? null, 
        loading, 
        error,
        refresh: fetchSession 
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider")
  }
  return context
}
