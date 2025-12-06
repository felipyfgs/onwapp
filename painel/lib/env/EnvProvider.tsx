"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ENV_SCRIPT_ID } from "./EnvScript"
import type { RuntimeEnvConfig } from "./config"

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
  const [envConfig, setEnvConfig] = useState<RuntimeEnvConfig>(defaultEnvConfig)

  useEffect(() => {
    const config = getRuntimeEnv()
    setEnvConfig(config)
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
