import type { 
  Session, 
  CreateSessionRequest, 
  QRCodeResponse, 
  MessageResponse,
  ConnectResponse,
  PairPhoneResponse,
} from "@/lib/types/session"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ""

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message)
    this.name = "RateLimitError"
  }
}

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
