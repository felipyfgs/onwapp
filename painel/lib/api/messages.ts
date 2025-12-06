import type {
  SendTextRequest,
  SendImageRequest,
  SendAudioRequest,
  SendVideoRequest,
  SendDocumentRequest,
  SendStickerRequest,
  SendLocationRequest,
  SendContactRequest,
  SendPollRequest,
  SendButtonsRequest,
  SendListRequest,
  SendInteractiveRequest,
  SendTemplateRequest,
  SendCarouselRequest,
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

export async function sendImage(session: string, data: SendImageRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/image`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendAudio(session: string, data: SendAudioRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/audio`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendVideo(session: string, data: SendVideoRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/video`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendDocument(session: string, data: SendDocumentRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/document`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendSticker(session: string, data: SendStickerRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/sticker`, {
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

export async function sendPoll(session: string, data: SendPollRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/poll`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendButtons(session: string, data: SendButtonsRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/buttons`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendList(session: string, data: SendListRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/list`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendInteractive(session: string, data: SendInteractiveRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/interactive`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendTemplate(session: string, data: SendTemplateRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/template`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendCarousel(session: string, data: SendCarouselRequest): Promise<MessageResponse> {
  return fetchAPI<MessageResponse>(`/${session}/message/send/carousel`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
