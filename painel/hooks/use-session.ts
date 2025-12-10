"use client"

import { useState, useEffect } from "react"
import { ApiSession, getSessionById } from "@/lib/api/sessions"

interface UseSessionResult {
  session: ApiSession | null
  sessionName: string | null
  loading: boolean
  error: string | null
}

export function useSession(sessionId: string): UseSessionResult {
  const [session, setSession] = useState<ApiSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSession() {
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
    }

    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  return {
    session,
    sessionName: session?.session ?? null,
    loading,
    error,
  }
}
