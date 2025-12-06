"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { setApiConfig } from "@/lib/api/sessions"
import { useEnvConfig } from "@/lib/env"

interface AuthContextType {
  apiKey: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (apiKey: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "onwapp_auth"
const PUBLIC_ROUTES = ["/login"]
const LOGIN_TIMEOUT = 10000 // 10 seconds
const MAX_API_KEY_LENGTH = 128
const MIN_API_KEY_LENGTH = 16

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, "") // Remove potential XSS chars
    .slice(0, MAX_API_KEY_LENGTH)
}

// Validate API key format
function isValidApiKey(key: string): boolean {
  if (!key || key.length < MIN_API_KEY_LENGTH || key.length > MAX_API_KEY_LENGTH) {
    return false
  }
  // Allow alphanumeric and common token chars
  return /^[a-zA-Z0-9_\-\.]+$/.test(key)
}

// Use sessionStorage for better security (clears on browser close)
function getStoredAuth(): string | null {
  if (typeof window === "undefined") return null
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function setStoredAuth(key: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, key)
  } catch {
    // Storage might be full or disabled
  }
}

function clearStoredAuth(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    // Also clear localStorage in case it was used before
    localStorage.removeItem("onwapp_api_key")
  } catch {
    // Ignore errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const envConfig = useEnvConfig()

  useEffect(() => {
    const stored = getStoredAuth()
    if (stored && isValidApiKey(stored)) {
      setApiKey(stored)
      setApiConfig({ apiUrl: envConfig.apiUrl, apiKey: stored })
    } else {
      // Clear invalid stored data
      clearStoredAuth()
    }
    setIsLoading(false)
  }, [envConfig.apiUrl])

  useEffect(() => {
    if (isLoading) return

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

    if (!apiKey && !isPublicRoute) {
      router.push("/login")
    } else if (apiKey && isPublicRoute) {
      router.push("/sessions")
    }
  }, [apiKey, isLoading, pathname, router])

  const login = useCallback(async (key: string): Promise<boolean> => {
    // Sanitize and validate
    const sanitizedKey = sanitizeInput(key)
    if (!isValidApiKey(sanitizedKey)) {
      return false
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), LOGIN_TIMEOUT)

      const response = await fetch(`${envConfig.apiUrl}/sessions`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": sanitizedKey,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return false
      }

      setApiKey(sanitizedKey)
      setApiConfig({ apiUrl: envConfig.apiUrl, apiKey: sanitizedKey })
      setStoredAuth(sanitizedKey)
      return true
    } catch {
      return false
    }
  }, [envConfig.apiUrl])

  const logout = useCallback(() => {
    setApiKey(null)
    clearStoredAuth()
    // Clear API config
    setApiConfig({ apiUrl: envConfig.apiUrl, apiKey: "" })
    router.push("/login")
  }, [router, envConfig.apiUrl])

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
