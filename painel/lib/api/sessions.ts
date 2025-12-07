import type { 
  Session, 
  CreateSessionRequest, 
  QRCodeResponse, 
  MessageResponse,
  ConnectResponse,
  PairPhoneResponse,
} from "@/lib/types/session"

export interface ApiConfig {
  apiUrl: string
  apiKey: string
}

let globalConfig: ApiConfig | null = null

// Request timeout in milliseconds
const DEFAULT_TIMEOUT = 30000

export function setApiConfig(config: ApiConfig) {
  globalConfig = config
}

export function getApiConfig(): ApiConfig {
  if (globalConfig) {
    return globalConfig
  }
  // Fallback - should match EnvProvider defaults
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message)
    this.name = "RateLimitError"
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message)
    this.name = "TimeoutError"
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number
}

async function fetchAPI<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const { apiUrl, apiKey } = getApiConfig()
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT
  
  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "Authorization": apiKey } : {}),
        ...options?.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After")
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : undefined
        throw new RateLimitError(
          "Limite de requisições excedido. Por favor, tente novamente mais tarde.",
          retrySeconds
        )
      }

      if (response.status === 401) {
        // Clear stored auth on unauthorized
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("onwapp_auth")
        }
        throw new Error("Sessão expirada. Faça login novamente.")
      }

      const error = await response.json().catch(() => ({ error: response.statusText }))
      const errorMessage = error.error || error.message || `API request failed: ${response.status}`
      
      if (errorMessage.toLowerCase().includes("rate limit") || 
          errorMessage.toLowerCase().includes("limite")) {
        throw new RateLimitError(errorMessage)
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof RateLimitError || error instanceof TimeoutError) {
      throw error
    }
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new TimeoutError("A requisição demorou muito. Tente novamente.")
      }
      if (error.message === "Failed to fetch") {
        throw new Error("Não foi possível conectar à API. Verifique se o backend está rodando.")
      }
    }
    
    throw error
  }
}

// Sessions CRUD
export async function fetchSessions(): Promise<Session[]> {
  return fetchAPI<Session[]>("/sessions")
}

export async function createSession(data: CreateSessionRequest): Promise<Session> {
  return fetchAPI<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function deleteSession(session: string): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}`, {
    method: "DELETE",
  })
}

// Session Lifecycle
export async function connectSession(session: string): Promise<ConnectResponse> {
  return fetchAPI<ConnectResponse>(`/${session}/connect`, {
    method: "POST",
  })
}

export async function disconnectSession(session: string): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/disconnect`, {
    method: "POST",
  })
}

export async function logoutSession(session: string): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/logout`, {
    method: "POST",
  })
}

export async function restartSession(session: string): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/restart`, {
    method: "POST",
  })
}

// QR Code & Pairing
export async function getQRCode(session: string): Promise<QRCodeResponse> {
  return fetchAPI<QRCodeResponse>(`/${session}/qr`)
}

export async function pairPhone(session: string, phone: string): Promise<PairPhoneResponse> {
  return fetchAPI<PairPhoneResponse>(`/${session}/pairphone`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  })
}

// Session Status
export async function getSessionStatus(session: string): Promise<Session> {
  return fetchAPI<Session>(`/${session}/status`)
}
