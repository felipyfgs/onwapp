"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  apiKey: string | null
  setApiKey: (key: string | null) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [apiKey, setApiKeyState] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const storedKey = localStorage.getItem('apiKey')
    setApiKeyState(storedKey)
    setIsLoading(false)
  }, [])

  const setApiKey = (key: string | null) => {
    if (key) {
      localStorage.setItem('apiKey', key)
      document.cookie = `apiKey=${key}; path=/; max-age=${60 * 60 * 24 * 30}`
    } else {
      localStorage.removeItem('apiKey')
      document.cookie = 'apiKey=; path=/; max-age=0'
    }
    setApiKeyState(key)
  }

  const logout = () => {
    setApiKey(null)
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ apiKey, setApiKey, logout, isAuthenticated: !!apiKey }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
