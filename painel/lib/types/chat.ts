export interface Chat {
  jid: string
  name?: string
  pushName?: string
  isGroup: boolean
  unreadCount: number
  lastMessageTime?: string
  lastMessage?: string
  archived?: boolean
  pinned?: boolean
  muted?: boolean
}

export interface ChatsResponse {
  chats: Chat[]
}

export interface Message {
  id: string
  chatJid: string
  senderJid: string
  timestamp: string
  pushName?: string
  text?: string
  isFromMe: boolean
  isGroup: boolean
  mediaType?: string
  caption?: string
}

export interface MessagesResponse {
  messages: Message[]
}
