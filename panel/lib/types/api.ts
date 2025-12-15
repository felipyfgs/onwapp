export interface Session {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qr?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  jid: string;
  name: string;
  phone: string;
  avatar?: string;
  blocked?: boolean;
}

export interface Chat {
  jid: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  archived?: boolean;
}

export interface Message {
  id: string;
  chatJid: string;
  fromMe: boolean;
  sender?: string;
  timestamp: string;
  text?: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contact' | 'poll';
  mediaUrl?: string;
}

export interface Group {
  jid: string;
  name: string;
  subject: string;
  owner: string;
  participants: GroupParticipant[];
  createdAt: string;
}

export interface GroupParticipant {
  jid: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface Profile {
  name: string;
  status: string;
  picture?: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  enabled: boolean;
}

export interface ChatwootConfig {
  url: string;
  accountId: string;
  token: string;
  enabled: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
