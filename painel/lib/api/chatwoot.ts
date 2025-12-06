import type { 
  ChatwootConfig, 
  SetChatwootConfigRequest, 
  SyncStatus,
  SyncOverview,
  OrphanStats,
  MessageResponse 
} from "@/lib/types/chatwoot"
import { RateLimitError } from "./sessions"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ""

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { "Authorization": API_KEY } : {}),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After")
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : undefined
        throw new RateLimitError(
          "Limite de requisições excedido. Por favor, tente novamente mais tarde.",
          retrySeconds
        )
      }

      let errorMessage = `API request failed: ${response.status}`
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      
      // Check if error message contains rate limit info
      if (errorMessage.toLowerCase().includes("rate limit") || 
          errorMessage.toLowerCase().includes("limite")) {
        throw new RateLimitError(errorMessage)
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error
    }
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Não foi possível conectar à API. Verifique se o backend está rodando.")
    }
    throw error
  }
}

// Get Chatwoot configuration for a session
export async function getChatwootConfig(session: string): Promise<ChatwootConfig> {
  return fetchAPI<ChatwootConfig>(`/sessions/${session}/chatwoot/find`)
}

// Set Chatwoot configuration for a session
export async function setChatwootConfig(session: string, data: SetChatwootConfigRequest): Promise<ChatwootConfig> {
  return fetchAPI<ChatwootConfig>(`/sessions/${session}/chatwoot/set`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Delete Chatwoot configuration for a session
export async function deleteChatwootConfig(session: string): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/sessions/${session}/chatwoot`, {
    method: "DELETE",
  })
}

// Sync contacts to Chatwoot
export async function syncContacts(session: string): Promise<SyncStatus> {
  return fetchAPI<SyncStatus>(`/sessions/${session}/chatwoot/sync/contacts`, {
    method: "POST",
  })
}

// Sync messages to Chatwoot
export async function syncMessages(session: string, days?: number): Promise<SyncStatus> {
  const query = days ? `?days=${days}` : ""
  return fetchAPI<SyncStatus>(`/sessions/${session}/chatwoot/sync/messages${query}`, {
    method: "POST",
  })
}

// Full sync (contacts + messages) to Chatwoot
export async function syncAll(session: string, days?: number): Promise<SyncStatus> {
  const query = days ? `?days=${days}` : ""
  return fetchAPI<SyncStatus>(`/sessions/${session}/chatwoot/sync${query}`, {
    method: "POST",
  })
}

// Get sync status
export async function getSyncStatus(session: string): Promise<SyncStatus> {
  return fetchAPI<SyncStatus>(`/sessions/${session}/chatwoot/sync/status`)
}

// Get sync overview statistics
export async function getSyncOverview(session: string): Promise<SyncOverview> {
  return fetchAPI<SyncOverview>(`/sessions/${session}/chatwoot/overview`)
}

// Get orphan records stats
export async function getOrphanStats(session: string): Promise<OrphanStats> {
  return fetchAPI<OrphanStats>(`/sessions/${session}/chatwoot/orphans`)
}

// Cleanup orphan records
export async function cleanupOrphans(session: string): Promise<OrphanStats> {
  return fetchAPI<OrphanStats>(`/sessions/${session}/chatwoot/cleanup`, {
    method: "POST",
  })
}

// Reset Chatwoot data for testing
export async function resetChatwoot(session: string): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/sessions/${session}/chatwoot/reset`, {
    method: "POST",
  })
}

// Resolve all open conversations
export async function resolveAllConversations(session: string): Promise<{ message: string; resolved: number }> {
  return fetchAPI<{ message: string; resolved: number }>(`/sessions/${session}/chatwoot/resolve-all`, {
    method: "POST",
  })
}

// Get conversations stats
export async function getConversationsStats(session: string): Promise<{ open: number }> {
  return fetchAPI<{ open: number }>(`/sessions/${session}/chatwoot/conversations/stats`)
}

