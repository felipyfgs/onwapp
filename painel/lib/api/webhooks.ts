import type { 
  Webhook, 
  SetWebhookRequest, 
  WebhookEventsResponse,
  MessageResponse 
} from "@/lib/types/webhook"
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

      const error = await response.json().catch(() => ({ error: response.statusText }))
      const errorMessage = error.error || error.message || `API request failed: ${response.status}`
      
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

// Get webhook configuration for a session
export async function getWebhook(session: string): Promise<Webhook> {
  return fetchAPI<Webhook>(`/${session}/webhook`)
}

// Set webhook configuration for a session
export async function setWebhook(session: string, data: SetWebhookRequest): Promise<Webhook> {
  return fetchAPI<Webhook>(`/${session}/webhook`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Update webhook configuration for a session
export async function updateWebhook(session: string, data: SetWebhookRequest): Promise<Webhook> {
  return fetchAPI<Webhook>(`/${session}/webhook`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

// Delete webhook configuration for a session
export async function deleteWebhook(session: string): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/webhook`, {
    method: "DELETE",
  })
}

// Get available webhook events
export async function getWebhookEvents(): Promise<WebhookEventsResponse> {
  return fetchAPI<WebhookEventsResponse>(`/events`)
}

