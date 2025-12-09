"use client"

const AUTH_KEY = "onwapp_api_key"

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_KEY)
}

export function setStoredApiKey(apiKey: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AUTH_KEY, apiKey)
}

export function removeStoredApiKey(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  return getStoredApiKey() !== null
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    const response = await fetch(`${API_URL}/sessions`, {
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
    })
    return response.ok
  } catch (error) {
    console.error("Error validating API key:", error)
    return false
  }
}

export async function login(apiKey: string): Promise<{ success: boolean; error?: string }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, error: "API Key é obrigatória" }
  }

  const isValid = await validateApiKey(apiKey)
  
  if (!isValid) {
    return { success: false, error: "API Key inválida" }
  }

  setStoredApiKey(apiKey)
  return { success: true }
}

export function logout(): void {
  removeStoredApiKey()
}
