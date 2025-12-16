import { apiClient, ApiResponse } from "./client"

export interface SendResponse {
  messageId: string
  timestamp: number
}

export interface QuotedMessage {
  messageId: string
  chatJid: string
  senderJid?: string
}

export interface SendTextRequest {
  phone: string
  text: string
  quoted?: QuotedMessage
}

export interface SendImageRequest {
  phone: string
  image: string
  caption?: string
  mimetype?: string
  quoted?: QuotedMessage
}

export interface SendAudioRequest {
  phone: string
  audio: string
  ptt?: boolean
  mimetype?: string
  quoted?: QuotedMessage
}

export interface SendVideoRequest {
  phone: string
  video: string
  caption?: string
  mimetype?: string
  quoted?: QuotedMessage
}

export interface SendDocumentRequest {
  phone: string
  document: string
  filename: string
  mimetype?: string
  quoted?: QuotedMessage
}

export interface SendStickerRequest {
  phone: string
  sticker: string
  mimetype?: string
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
  contactName: string
  contactPhone: string
}

export interface SendPollRequest {
  phone: string
  name: string
  options: string[]
  selectableCount?: number
}

export interface ButtonItem {
  buttonId: string
  displayText: string
}

export interface SendButtonsRequest {
  phone: string
  contentText: string
  buttons: ButtonItem[]
  headerText?: string
  footerText?: string
}

export interface ListRow {
  title: string
  description?: string
  rowId: string
}

export interface ListSection {
  title: string
  rows: ListRow[]
}

export interface SendListRequest {
  phone: string
  title: string
  description: string
  buttonText: string
  sections: ListSection[]
  footerText?: string
}

export interface InteractiveButtonParams {
  display_text: string
  id?: string
  url?: string
  phone_number?: string
  copy_code?: string
}

export interface InteractiveButton {
  name: "quick_reply" | "cta_url" | "cta_call" | "cta_copy"
  params: InteractiveButtonParams
}

export interface SendInteractiveRequest {
  phone: string
  body: string
  buttons: InteractiveButton[]
  title?: string
  footer?: string
  image?: string
  video?: string
  mimetype?: string
}

export interface TemplateButton {
  index: number
  quickReply?: { displayText: string; id: string }
  urlButton?: { displayText: string; url: string }
  callButton?: { displayText: string; phoneNumber: string }
}

export interface SendTemplateRequest {
  phone: string
  content: string
  buttons: TemplateButton[]
  title?: string
  footer?: string
  image?: string
  video?: string
  document?: string
  mimetype?: string
  filename?: string
}

export interface CarouselCardHeader {
  title?: string
  image?: string
  video?: string
  mimetype?: string
}

export interface CarouselCard {
  header?: CarouselCardHeader
  body: string
  footer?: string
  buttons: InteractiveButton[]
}

export interface SendCarouselRequest {
  phone: string
  cards: CarouselCard[]
  title?: string
  body?: string
  footer?: string
}

export interface SendReactionRequest {
  phone: string
  messageId: string
  emoji: string
}

export interface DeleteMessageRequest {
  phone: string
  messageId: string
  forMe?: boolean
}

export interface EditMessageRequest {
  phone: string
  messageId: string
  newText: string
}

export interface PollVoteRequest {
  phone: string
  pollMessageId: string
  selectedOptions: string[]
}

export interface RequestUnavailableRequest {
  chatId: string
  messageId: string
  senderJid?: string
}

export async function sendText(
  sessionId: string,
  data: SendTextRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/text`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendImage(
  sessionId: string,
  data: SendImageRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/image`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendAudio(
  sessionId: string,
  data: SendAudioRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/audio`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendVideo(
  sessionId: string,
  data: SendVideoRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/video`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendDocument(
  sessionId: string,
  data: SendDocumentRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/document`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendSticker(
  sessionId: string,
  data: SendStickerRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/sticker`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendLocation(
  sessionId: string,
  data: SendLocationRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/location`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendContact(
  sessionId: string,
  data: SendContactRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/contact`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendPoll(
  sessionId: string,
  data: SendPollRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/poll`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendButtons(
  sessionId: string,
  data: SendButtonsRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/buttons`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendList(
  sessionId: string,
  data: SendListRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/list`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendInteractive(
  sessionId: string,
  data: SendInteractiveRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/interactive`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendTemplate(
  sessionId: string,
  data: SendTemplateRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/template`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendCarousel(
  sessionId: string,
  data: SendCarouselRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/send/carousel`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function reactToMessage(
  sessionId: string,
  data: SendReactionRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/react`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function deleteMessage(
  sessionId: string,
  data: DeleteMessageRequest
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/message/delete`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function editMessage(
  sessionId: string,
  data: EditMessageRequest
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/message/edit`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function votePoll(
  sessionId: string,
  data: PollVoteRequest
): Promise<ApiResponse<SendResponse>> {
  return apiClient(`/${sessionId}/message/poll/vote`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function requestUnavailableMessage(
  sessionId: string,
  data: RequestUnavailableRequest
): Promise<ApiResponse<{ message: string }>> {
  return apiClient(`/${sessionId}/message/request-unavailable`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function sendMediaFile(
  sessionId: string,
  type: "image" | "audio" | "video" | "document" | "sticker",
  file: File,
  options: { phone: string; caption?: string; filename?: string; ptt?: boolean }
): Promise<ApiResponse<SendResponse>> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("phone", options.phone)
  if (options.caption) formData.append("caption", options.caption)
  if (options.filename) formData.append("filename", options.filename)
  if (options.ptt !== undefined) formData.append("ptt", String(options.ptt))

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  const response = await fetch(`${API_BASE_URL}/${sessionId}/message/send/${type}`, {
    method: "POST",
    headers: {
      "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
    },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    return { success: false, error: data.error || "Upload failed" }
  }
  return { success: true, data }
}
