export interface SendTextRequest {
  phone: string
  message: string
}

export interface SendMediaRequest {
  phone: string
  media: string
  caption?: string
  filename?: string
}

export interface SendLocationRequest {
  phone: string
  latitude: number
  longitude: number
  name?: string
  address?: string
}

export interface SendContactRequest {
  phone: string
  contact: {
    name: string
    phone: string
  }
}

export interface MessageResponse {
  messageId: string
  status: string
}

export type MessageType = "text" | "image" | "document" | "audio" | "video" | "location" | "contact"
