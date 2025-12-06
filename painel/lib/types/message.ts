// Basic message types
export interface SendTextRequest {
  phone: string
  text: string
}

export interface SendMediaRequest {
  phone: string
  media: string
  caption?: string
  filename?: string
  mimetype?: string
}

export interface SendImageRequest {
  phone: string
  image: string
  caption?: string
  mimetype?: string
}

export interface SendAudioRequest {
  phone: string
  audio: string
  ptt?: boolean
  mimetype?: string
}

export interface SendVideoRequest {
  phone: string
  video: string
  caption?: string
  mimetype?: string
}

export interface SendDocumentRequest {
  phone: string
  document: string
  filename: string
  mimetype?: string
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

// Poll
export interface SendPollRequest {
  phone: string
  name: string
  options: string[]
  selectableCount?: number
}

// Buttons (simple buttons - max 3)
export interface ButtonDTO {
  buttonId: string
  displayText: string
}

export interface SendButtonsRequest {
  phone: string
  contentText: string
  footerText?: string
  headerText?: string
  buttons: ButtonDTO[]
}

// List message
export interface ListRowDTO {
  title: string
  description?: string
  rowId: string
}

export interface ListSectionDTO {
  title: string
  rows: ListRowDTO[]
}

export interface SendListRequest {
  phone: string
  title: string
  description: string
  buttonText: string
  footerText?: string
  sections: ListSectionDTO[]
}

// Interactive (native flow buttons)
export interface NativeFlowButtonDTO {
  name: string
  params: Record<string, unknown>
}

export interface SendInteractiveRequest {
  phone: string
  title?: string
  body: string
  footer?: string
  buttons: NativeFlowButtonDTO[]
  image?: string
  video?: string
  mimetype?: string
}

// Template buttons
export interface TemplateQuickReplyDTO {
  displayText: string
  id: string
}

export interface TemplateURLButtonDTO {
  displayText: string
  url: string
}

export interface TemplateCallButtonDTO {
  displayText: string
  phoneNumber: string
}

export interface TemplateButtonDTO {
  index?: number
  quickReply?: TemplateQuickReplyDTO
  urlButton?: TemplateURLButtonDTO
  callButton?: TemplateCallButtonDTO
}

export interface SendTemplateRequest {
  phone: string
  title?: string
  content: string
  footer?: string
  buttons: TemplateButtonDTO[]
  image?: string
  video?: string
  document?: string
  mimetype?: string
  filename?: string
}

// Carousel
export interface CarouselCardHeaderDTO {
  title?: string
  image?: string
  video?: string
  mimetype?: string
}

export interface CarouselCardDTO {
  header: CarouselCardHeaderDTO
  body: string
  footer?: string
  buttons: NativeFlowButtonDTO[]
}

export interface SendCarouselRequest {
  phone: string
  title?: string
  body?: string
  footer?: string
  cards: CarouselCardDTO[]
}

// Response
export interface MessageResponse {
  messageId: string
  status: string
}

export type MessageType = 
  | "text" 
  | "image" 
  | "document" 
  | "audio" 
  | "video" 
  | "sticker"
  | "location" 
  | "contact"
  | "poll"
  | "buttons"
  | "list"
  | "interactive"
  | "template"
  | "carousel"
