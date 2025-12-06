import type {
  Contact,
  CheckPhoneResult,
  BlocklistResponse,
  UpdateBlocklistRequest,
} from "@/lib/types/contact"
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

export async function getContacts(session: string): Promise<Contact[]> {
  const response = await fetchAPI<Record<string, { pushName?: string; businessName?: string; fullName?: string; firstName?: string }>>(`/${session}/contact/list`)
  
  // Convert map response to array, filtering out LID contacts (they don't have phone numbers)
  return Object.entries(response)
    .filter(([jid]) => jid.endsWith("@s.whatsapp.net")) // Only phone contacts
    .map(([jid, data]) => ({
      jid,
      name: data.fullName || data.firstName,
      pushName: data.pushName,
      businessName: data.businessName,
      found: true,
    }))
}

export async function checkPhones(session: string, phones: string[]): Promise<CheckPhoneResult[]> {
  return fetchAPI<CheckPhoneResult[]>(`/${session}/contact/check`, {
    method: "POST",
    body: JSON.stringify({ phones }),
  })
}

export async function getBlocklist(session: string): Promise<BlocklistResponse> {
  const response = await fetchAPI<{ blocklist?: string[] }>(`/${session}/contact/blocklist`)
  return { blocklist: response.blocklist || [] }
}

export async function updateBlocklist(session: string, data: UpdateBlocklistRequest): Promise<void> {
  return fetchAPI<void>(`/${session}/contact/blocklist`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
