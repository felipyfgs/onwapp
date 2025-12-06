"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function MessagesPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  useEffect(() => {
    router.replace(`/sessions/${sessionId}/messages/send`)
  }, [sessionId, router])

  return null
}
