"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    // Tenta restaurar sessão do storage
    checkAuth()
    
    // Verifica se tem sessão após o check
    const currentState = useAuthStore.getState()
    if (currentState.isAuthenticated) {
      setIsReady(true)
    } else {
      // Sem sessão, redireciona imediatamente
      router.replace("/login")
    }
  }, [])

  if (!isReady) {
    // Mostra loader breve durante verificação inicial
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
