"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ChatwootPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  useEffect(() => {
    // Redireciona para a página de configuração
    router.replace(`/sessions/${sessionId}/integrations/chatwoot/config`)
  }, [sessionId, router])

  return null
}

