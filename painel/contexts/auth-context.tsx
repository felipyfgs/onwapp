"use client"

import React, { createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { getStoredApiKey, removeStoredApiKey, setStoredApiKey } from "@/lib/auth"

interface AuthContextType {
  apiKey: string | null
  isAuthenticated: boolean
  login: (apiKey: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getInitialApiKey(): string | null {
  if (typeof window === "undefined") return null
  return getStoredApiKey()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(getInitialApiKey)
  const router = useRouter()

  const login = (key: string) => {
    setStoredApiKey(key)
    setApiKey(key)
    router.push("/sessions")
  }

  const logout = () => {
    removeStoredApiKey()
    setApiKey(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        apiKey,
        isAuthenticated: apiKey !== null,
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
