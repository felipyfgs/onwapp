import type { Chat, ChatMessage } from "@/lib/api/chats"

// ============================================================
// DISPLAY FORMATTERS
// ============================================================

export function getDisplayName(chat: Chat): string {
  return chat.contactName || chat.name || formatJid(chat.jid)
}

export function formatJid(jid: string): string {
  if (jid.includes("@g.us")) return "Grupo"
  const phone = jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
  return `+${phone}`
}

export function getInitials(chat: Chat): string {
  const name = chat.contactName || chat.name || ""
  return name.slice(0, 2).toUpperCase() || "?"
}

// ============================================================
// TIME FORMATTERS
// ============================================================

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatLastSeen(timestamp?: number): string {
  if (!timestamp) return ""
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return "online"
  if (diffMins < 60) return `visto há ${diffMins} min`
  return `visto às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

export function formatChatTime(timestamp?: number): string {
  if (!timestamp) return ""
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }
  if (diffDays === 1) return "Ontem"
  if (diffDays < 7) return date.toLocaleDateString("pt-BR", { weekday: "short" })
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

export function formatDateSeparator(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoje"
  if (diffDays === 1) return "Ontem"
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

// ============================================================
// MESSAGE HELPERS
// ============================================================

export function getMessagePreview(chat: Chat): string {
  if (!chat.lastMessage) return ""
  const msg = chat.lastMessage
  if (msg.type === "image" || msg.mediaType === "image") return "📷 Foto"
  if (msg.type === "video" || msg.mediaType === "video") return "🎥 Vídeo"
  if (msg.type === "audio" || msg.mediaType === "audio" || msg.type === "ptt") return "🎤 Áudio"
  if (msg.type === "document" || msg.mediaType === "document") return "📄 Documento"
  if (msg.type === "sticker") return "🎭 Figurinha"
  if (msg.type === "location") return "📍 Localização"
  if (msg.type === "contact") return "👤 Contato"
  return msg.content || ""
}

export interface MessageGroup {
  date: string
  messages: ChatMessage[]
}

export function groupMessagesByDate(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  let currentDate = ""

  for (const msg of messages) {
    const dateStr = formatDateSeparator(msg.timestamp)
    if (dateStr !== currentDate) {
      currentDate = dateStr
      groups.push({ date: dateStr, messages: [msg] })
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  }

  return groups
}

// ============================================================
// MESSAGE TYPE CHECKERS
// ============================================================

export function isAudioMessage(message: ChatMessage): boolean {
  return message.type === "audio" || message.type === "ptt" || message.mediaType === "audio"
}

export function isImageMessage(message: ChatMessage): boolean {
  return message.type === "image" || message.mediaType === "image"
}

export function isVideoMessage(message: ChatMessage): boolean {
  return message.type === "video" || message.mediaType === "video"
}

export function isDocumentMessage(message: ChatMessage): boolean {
  return message.type === "document" || message.mediaType === "document"
}

export function isStickerMessage(message: ChatMessage): boolean {
  return message.type === "sticker" || message.mediaType === "sticker"
}

export function isMediaMessage(message: ChatMessage): boolean {
  return isImageMessage(message) || isVideoMessage(message) || isDocumentMessage(message) || isAudioMessage(message) || isStickerMessage(message)
}

// ============================================================
// JID HELPERS
// ============================================================

export function getPhoneFromJid(jid: string): string {
  return jid.replace("@s.whatsapp.net", "").replace("@g.us", "").replace("@c.us", "")
}

export function isGroupJid(jid: string): boolean {
  return jid.includes("@g.us")
}
