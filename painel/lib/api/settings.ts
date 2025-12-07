import type { Settings, UpdateSettingsRequest } from "@/lib/types/settings"
import { getApiConfig } from "./sessions"

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const { apiUrl, apiKey } = getApiConfig()
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: apiKey } : {}),
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
