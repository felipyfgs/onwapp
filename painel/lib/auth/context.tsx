"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { setApiConfig } from "@/lib/api/sessions"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface AuthContextType {
  apiKey: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (apiKey: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "onwapp_api_key"
const PUBLIC_ROUTES = ["/login"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setApiKey(stored)
      setApiConfig({ apiUrl: API_URL, apiKey: stored })
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) return

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

    if (!apiKey && !isPublicRoute) {
      router.push("/login")
    } else if (apiKey && isPublicRoute) {
      router.push("/sessions")
    }
  }, [apiKey, isLoading, pathname, router])

  const login = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/sessions`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": key,
        },
      })

      if (!response.ok) {
        return false
      }

      setApiKey(key)
      setApiConfig({ apiUrl: API_URL, apiKey: key })
      localStorage.setItem(STORAGE_KEY, key)
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setApiKey(null)
    localStorage.removeItem(STORAGE_KEY)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        apiKey,
        isAuthenticated: !!apiKey,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
