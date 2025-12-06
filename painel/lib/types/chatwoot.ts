// Chatwoot types based on backend models

export interface ChatwootConfig {
  id: string
  sessionId: string
  enabled: boolean
  url: string
  token: string
  account: number
  inboxId?: number
  inbox?: string
  signAgent: boolean
  signSeparator?: string
  autoReopen: boolean
  startPending: boolean
  mergeBrPhones: boolean
  syncContacts: boolean
  syncMessages: boolean
  syncDays?: number
  importAsResolved: boolean
  ignoreChats?: string[]
  autoCreate: boolean
  webhookUrl?: string
  chatwootDbHost?: string
  chatwootDbPort?: number
  chatwootDbUser?: string
  chatwootDbPass?: string
  chatwootDbName?: string
  createdAt?: string
  updatedAt?: string
  warnings?: string[]
}

export interface SetChatwootConfigRequest {
  enabled: boolean
  url?: string
  token?: string
  account?: number
  inboxId?: number
  inbox?: string
  signAgent?: boolean
  signSeparator?: string
  autoReopen?: boolean
  startPending?: boolean
  mergeBrPhones?: boolean
  syncContacts?: boolean
  syncMessages?: boolean
  syncDays?: number
  ignoreChats?: string[]
  autoCreate?: boolean
  number?: string
  organization?: string
  logo?: string
  chatwootDbHost?: string
  chatwootDbPort?: number
  chatwootDbUser?: string
  chatwootDbPass?: string
  chatwootDbName?: string
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

export interface SyncStatus {
  sessionId: string
  status: "idle" | "running" | "completed" | "failed"
  type: "contacts" | "messages" | "all"
  startedAt?: string
  endedAt?: string
  stats: SyncStats
  error?: string
}

export interface SyncOverview {
  contacts: {
    totalChatwoot: number
    whatsAppSynced: number
    groups: number
    private: number
    withName: number
    withoutName: number
  }
  conversations: {
    total: number
    open: number
    resolved: number
    pending: number
    groupChats: number
    privateChats: number
  }
  messages: {
    total: number
    incoming: number
    outgoing: number
  }
}

export interface OrphanStats {
  messages: number
  conversations: number
  contactInboxes: number
}

export interface MessageResponse {
  message: string
}

