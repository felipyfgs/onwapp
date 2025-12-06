import type {
  ProfileResponse,
  SetNameRequest,
  SetStatusRequest,
  SetPictureResponse,
} from "@/lib/types/profile"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ""

class APIError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = "APIError"
  }
}

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
    const message = error.error || error.message || `API request failed: ${response.status}`
    throw new APIError(message, response.status)
  }

  return response.json()
}

export { APIError }

export async function getProfile(session: string): Promise<ProfileResponse> {
  return fetchAPI<ProfileResponse>(`/${session}/profile`)
}

export async function setName(session: string, name: string): Promise<SetNameRequest> {
  return fetchAPI<SetNameRequest>(`/${session}/profile/name`, {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export async function setStatus(session: string, status: string): Promise<SetStatusRequest> {
  return fetchAPI<SetStatusRequest>(`/${session}/profile/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  })
}

export async function setPicture(session: string, image: string): Promise<SetPictureResponse> {
  return fetchAPI<SetPictureResponse>(`/${session}/profile/picture`, {
    method: "POST",
    body: JSON.stringify({ image }),
  })
}

export async function removePicture(session: string): Promise<void> {
  return fetchAPI<void>(`/${session}/profile/picture/remove`, {
    method: "POST",
  })
}
