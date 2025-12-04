export type SessionStatusType = 'connected' | 'disconnected' | 'qr_pending' | 'connecting'

export interface SessionStats {
  messages: number
  chats: number
  contacts: number
  groups: number
}

export interface Session {
  id: string
  name: string
  status: SessionStatusType
  phone?: string
  deviceJid?: string
  apiKey?: string
  profilePicture?: string
  pushName?: string
  stats?: SessionStats
  createdAt?: string
  updatedAt?: string
}

// Webhook types
export interface WebhookConfig {
  id?: string
  sessionId: string
  url: string
  events: string[]
  enabled: boolean
  secret?: string
}

export interface WebhookEvents {
  categories: Record<string, string[]>
  all: string[]
}

// Chatwoot types
export interface ChatwootConfig {
  id?: string
  sessionId?: string
  enabled: boolean
  url: string
  token: string
  account: number
  inbox?: string
  inboxId?: number
  signAgent: boolean
  signSeparator?: string
  autoReopen: boolean
  startPending: boolean
  syncContacts: boolean
  syncMessages: boolean
  syncDays?: number
  importAsResolved?: boolean
  mergeBrPhones: boolean
  ignoreChats?: string[]
  autoCreate: boolean
  number?: string
  organization?: string
  logo?: string
  chatwootDbHost?: string
  chatwootDbPort?: number
  chatwootDbUser?: string
  chatwootDbPass?: string
  chatwootDbName?: string
  webhookUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface ContactSyncDetails {
  savedContacts: number
  businessContacts: number
  alreadyExists: number
  groups: number
  statusBroadcast: number
  newsletters: number
  notInAgenda: number
  lidContacts: number
  invalidPhone: number
  totalWhatsApp: number
}

export interface MessageSyncDetails {
  textMessages: number
  mediaMessages: number
  groupMessages: number
  alreadySynced: number
  oldMessages: number
  statusBroadcast: number
  newsletters: number
  protocol: number
  reactions: number
  system: number
  emptyContent: number
  noMedia: number
  lidChats: number
  privateChats: number
  groupChats: number
}

export interface SyncStats {
  contactsImported: number
  contactsSkipped: number
  contactsErrors: number
  messagesImported: number
  messagesSkipped: number
  messagesErrors: number
  conversationsUsed: number
  errors: number
  contactDetails?: ContactSyncDetails
  messageDetails?: MessageSyncDetails
}

export interface SyncStatus {
  sessionId: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  type: 'contacts' | 'messages' | 'all'
  startedAt?: string
  endedAt?: string
  stats: SyncStats
  error?: string
}
