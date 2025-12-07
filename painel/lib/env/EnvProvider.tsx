"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ENV_SCRIPT_ID } from "./EnvScript"
import type { RuntimeEnvConfig } from "./config"
import { setApiConfig } from "@/lib/api/sessions"

const defaultEnvConfig: RuntimeEnvConfig = {
  apiUrl: "http://localhost:3000",
  apiKey: "",
}

const EnvContext = createContext<RuntimeEnvConfig>(defaultEnvConfig)

const isSSR = typeof window === "undefined"

function getRuntimeEnv(): RuntimeEnvConfig {
  if (isSSR) return defaultEnvConfig

  const script = document.getElementById(ENV_SCRIPT_ID) as HTMLScriptElement
  if (!script?.innerText) return defaultEnvConfig

  try {
    return JSON.parse(script.innerText)
  } catch {
    return defaultEnvConfig
  }
}

interface EnvProviderProps {
  children: ReactNode
}

export function EnvProvider({ children }: EnvProviderProps) {
  const [envConfig, setEnvConfig] = useState<RuntimeEnvConfig>(() => {
    // Initialize with runtime config immediately if available
    const config = getRuntimeEnv()
    // Also set API config immediately
    if (!isSSR) {
      setApiConfig({ apiUrl: config.apiUrl, apiKey: config.apiKey })
    }
    return config
  })

  useEffect(() => {
    const config = getRuntimeEnv()
    setEnvConfig(config)
    // Ensure API config is set
    setApiConfig({ apiUrl: config.apiUrl, apiKey: config.apiKey })
  }, [])

  return <EnvContext.Provider value={envConfig}>{children}</EnvContext.Provider>
}

export function useEnvConfig(): RuntimeEnvConfig {
  const context = useContext(EnvContext)
  if (context === undefined) {
    throw new Error("useEnvConfig must be used within an EnvProvider")
  }
  return context
}

// Helper hooks for common values
export function useApiUrl(): string {
  return useEnvConfig().apiUrl
}

export function useApiKey(): string {
  return useEnvConfig().apiKey
}
