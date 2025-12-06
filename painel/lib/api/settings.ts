import type { Settings, UpdateSettingsRequest } from "@/lib/types/settings"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ""

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: API_KEY } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || error.message || `API request failed: ${response.status}`)
  }

  return response.json()
}

export async function getSettings(session: string): Promise<Settings> {
  return fetchAPI<Settings>(`/${session}/settings`)
}

export async function updateSettings(session: string, data: UpdateSettingsRequest): Promise<Settings> {
  return fetchAPI<Settings>(`/${session}/settings`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
