import type {
  SendTextRequest,
  SendMediaRequest,
  SendLocationRequest,
  SendContactRequest,
  MessageResponse,
} from "@/lib/types/message"

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

export async function sendText(session: string, data: SendTextRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/text`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendImage(session: string, data: SendMediaRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/image`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendDocument(session: string, data: SendMediaRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/document`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendAudio(session: string, data: SendMediaRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/audio`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendVideo(session: string, data: SendMediaRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/video`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendLocation(session: string, data: SendLocationRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/location`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendContact(session: string, data: SendContactRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/contact`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
