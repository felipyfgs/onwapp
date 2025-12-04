const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''

export interface SessionStats {
  messages: number
  chats: number
  contacts: number
  groups: number
}

export interface SessionResponse {
  id: string
  session: string
  deviceJid?: string
  phone?: string
  status: string
  apiKey?: string
  pushName?: string
  profilePicture?: string
  stats?: SessionStats
  createdAt: string
  updatedAt: string
}

export interface SessionStatus {
  status: string
  version: string
  database: string
  time: string
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Authorization': API_KEY }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMsg = `API Error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData.error) {
        errorMsg = errorData.error
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMsg)
  }

  return response.json()
}

export async function getHealth(): Promise<SessionStatus> {
  return apiRequest<SessionStatus>('/health')
}

export async function getSessions(): Promise<SessionResponse[]> {
  return apiRequest<SessionResponse[]>('/sessions')
}

export async function createSession(sessionName: string, apiKey?: string): Promise<SessionResponse> {
  return apiRequest<SessionResponse>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ session: sessionName, apiKey }),
  })
}

export interface QRResponse {
  qr?: string
  status: string
}

export async function getSessionQRData(sessionName: string): Promise<QRResponse> {
  return apiRequest<QRResponse>(`/${sessionName}/qr`)
}

export async function getSessionStatus(sessionName: string): Promise<SessionStatus> {
  return apiRequest<SessionStatus>(`/${sessionName}/status`)
}

export async function connectSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/connect`, { method: 'POST' })
}

export async function disconnectSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/disconnect`, { method: 'POST' })
}

export async function deleteSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}`, { method: 'DELETE' })
}

export async function getSessionQR(sessionName: string): Promise<{ qr: string }> {
  return apiRequest<{ qr: string }>(`/${sessionName}/qr`)
}

export async function restartSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/restart`, { method: 'POST' })
}

export async function logoutSession(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/logout`, { method: 'POST' })
}

// Profile
export interface ProfileResponse {
  profile: {
    jid?: string
    name?: string
    status?: string
    pictureId?: string
  }
}

export async function getSessionProfile(sessionName: string): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>(`/${sessionName}/profile`)
}

// Avatar
export interface AvatarResponse {
  url: string
  id?: string
}

export async function getSessionAvatar(sessionName: string, phone: string): Promise<AvatarResponse> {
  return apiRequest<AvatarResponse>(`/${sessionName}/contact/avatar?phone=${encodeURIComponent(phone)}`)
}

// Contacts
export async function getSessionContacts(sessionName: string): Promise<Record<string, unknown>[]> {
  return apiRequest<Record<string, unknown>[]>(`/${sessionName}/contact/list`)
}

// Groups
export interface GroupResponse {
  jid: string
  name: string
  topic?: string
  participants?: string[]
}

export async function getSessionGroups(sessionName: string): Promise<GroupResponse[]> {
  return apiRequest<GroupResponse[]>(`/${sessionName}/group/list`)
}

// Chats (unread)
export interface ChatResponse {
  jid: string
  name?: string
  unreadCount?: number
  markedAsUnread?: boolean
  conversationTimestamp?: number
}

export async function getSessionChats(sessionName: string): Promise<ChatResponse[]> {
  return apiRequest<ChatResponse[]>(`/${sessionName}/history/chats/unread`)
}

// Get full session data with stats
export interface SessionWithStats extends SessionResponse {
  pushName?: string
  profilePicture?: string
  stats: {
    messages: number
    chats: number
    contacts: number
    groups: number
  }
}

export async function getSessionWithStats(sessionName: string, phone?: string): Promise<Partial<SessionWithStats>> {
  const result: Partial<SessionWithStats> = {
    stats: { messages: 0, chats: 0, contacts: 0, groups: 0 }
  }

  try {
    // Get profile (push name)
    const profile = await getSessionProfile(sessionName)
    result.pushName = profile.profile?.name
  } catch {
    // Ignore errors
  }

  try {
    // Get avatar
    if (phone) {
      const avatar = await getSessionAvatar(sessionName, phone)
      result.profilePicture = avatar.url
    }
  } catch {
    // Ignore errors
  }

  try {
    // Get contacts count
    const contacts = await getSessionContacts(sessionName)
    if (result.stats) {
      result.stats.contacts = Object.keys(contacts).length
    }
  } catch {
    // Ignore errors
  }

  try {
    // Get groups count
    const groups = await getSessionGroups(sessionName)
    if (result.stats) {
      result.stats.groups = groups.length
    }
  } catch {
    // Ignore errors
  }

  try {
    // Get chats count
    const chats = await getSessionChats(sessionName)
    if (result.stats) {
      result.stats.chats = chats.length
    }
  } catch {
    // Ignore errors
  }

  return result
}

// ============================================================================
// WEBHOOK API
// ============================================================================

import type { WebhookConfig, WebhookEvents, ChatwootConfig, SyncStatus } from './types'

export async function getWebhook(sessionName: string): Promise<WebhookConfig> {
  return apiRequest<WebhookConfig>(`/${sessionName}/webhook`)
}

export async function setWebhook(sessionName: string, config: Partial<WebhookConfig>): Promise<WebhookConfig> {
  return apiRequest<WebhookConfig>(`/${sessionName}/webhook`, {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function deleteWebhook(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/webhook`, { method: 'DELETE' })
}

export async function getWebhookEvents(): Promise<WebhookEvents> {
  return apiRequest<WebhookEvents>('/events')
}

// ============================================================================
// CHATWOOT API
// ============================================================================

export async function getChatwootConfig(sessionName: string): Promise<ChatwootConfig> {
  return apiRequest<ChatwootConfig>(`/sessions/${sessionName}/chatwoot/find`)
}

export async function setChatwootConfig(sessionName: string, config: Partial<ChatwootConfig>): Promise<ChatwootConfig> {
  return apiRequest<ChatwootConfig>(`/sessions/${sessionName}/chatwoot/set`, {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function deleteChatwootConfig(sessionName: string): Promise<void> {
  return apiRequest(`/sessions/${sessionName}/chatwoot`, { method: 'DELETE' })
}

export async function syncChatwoot(
  sessionName: string,
  type: 'all' | 'contacts' | 'messages' = 'all',
  days?: number
): Promise<SyncStatus> {
  const endpoint = type === 'all' 
    ? `/sessions/${sessionName}/chatwoot/sync`
    : `/sessions/${sessionName}/chatwoot/sync/${type}`
  const query = days ? `?days=${days}` : ''
  return apiRequest<SyncStatus>(`${endpoint}${query}`, { method: 'POST' })
}

export async function getChatwootSyncStatus(sessionName: string): Promise<SyncStatus> {
  return apiRequest<SyncStatus>(`/sessions/${sessionName}/chatwoot/sync/status`)
}

export async function resetChatwoot(sessionName: string): Promise<{ message: string; deleted: { contacts: number; conversations: number; messages: number } }> {
  return apiRequest(`/sessions/${sessionName}/chatwoot/reset`, { method: 'POST' })
}

export async function resolveAllConversations(sessionName: string): Promise<{ message: string; resolved: number }> {
  return apiRequest(`/sessions/${sessionName}/chatwoot/resolve-all`, { method: 'POST' })
}

export async function getConversationsStats(sessionName: string): Promise<{ open: number }> {
  return apiRequest(`/sessions/${sessionName}/chatwoot/conversations/stats`)
}

export interface SyncOverview {
  whatsapp: {
    contacts: number
  }
  chatwoot: {
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
}

export async function getSyncOverview(sessionName: string): Promise<SyncOverview> {
  return apiRequest(`/sessions/${sessionName}/chatwoot/overview`)
}

// ============================================================================
// CONTACTS API
// ============================================================================

export interface ContactInfo {
  pushName?: string
  businessName?: string
  fullName?: string
  firstName?: string
}

export type ContactsMap = Record<string, ContactInfo>

export interface Contact {
  jid: string
  pushName?: string
  businessName?: string
  fullName?: string
  firstName?: string
}

export async function getContacts(sessionName: string): Promise<Contact[]> {
  const data = await apiRequest<ContactsMap>(`/${sessionName}/contact/list`)
  // Converte map para array
  return Object.entries(data).map(([jid, info]) => ({
    jid,
    ...info
  }))
}

export interface CheckPhoneResult {
  phone: string
  isRegistered: boolean
  jid: string
}

export async function checkPhone(sessionName: string, phones: string[]): Promise<CheckPhoneResult[]> {
  return apiRequest<CheckPhoneResult[]>(`/${sessionName}/contact/check`, {
    method: 'POST',
    body: JSON.stringify({ phones }),
  })
}

export interface BlocklistResponse {
  jids: string[]
}

export async function getBlocklist(sessionName: string): Promise<BlocklistResponse> {
  return apiRequest<BlocklistResponse>(`/${sessionName}/contact/blocklist`)
}

export async function updateBlocklist(sessionName: string, phone: string, action: 'block' | 'unblock'): Promise<void> {
  return apiRequest(`/${sessionName}/contact/blocklist`, {
    method: 'POST',
    body: JSON.stringify({ phone, action }),
  })
}

export interface ContactInfoResponse {
  jid: string
  verifiedName?: string
  status?: string
  pictureId?: string
  devices?: string[]
}

export async function getContactInfo(sessionName: string, phone: string): Promise<ContactInfoResponse> {
  return apiRequest<ContactInfoResponse>(`/${sessionName}/contact/info?phone=${encodeURIComponent(phone)}`)
}

// ============================================================================
// GROUPS API
// ============================================================================

export interface GroupParticipant {
  jid: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export interface Group {
  jid: string
  name: string
  topic?: string
  topicId?: string
  topicSetAt?: string
  topicSetBy?: string
  owner?: string
  created?: string
  participants?: GroupParticipant[]
  announce?: boolean
  locked?: boolean
  ephemeral?: number
}

// Backend returns PascalCase, we need to map to camelCase
interface GroupRaw {
  JID: string
  Name: string
  Topic?: string
  TopicID?: string
  TopicSetAt?: string
  TopicSetBy?: string
  OwnerJID?: string
  GroupCreated?: string
  Participants?: Array<{
    JID: string
    IsAdmin: boolean
    IsSuperAdmin: boolean
  }>
  IsAnnounce?: boolean
  IsLocked?: boolean
  DisappearingTimer?: number
}

function mapGroup(raw: GroupRaw): Group {
  return {
    jid: raw.JID,
    name: raw.Name,
    topic: raw.Topic,
    topicId: raw.TopicID,
    topicSetAt: raw.TopicSetAt,
    topicSetBy: raw.TopicSetBy,
    owner: raw.OwnerJID,
    created: raw.GroupCreated,
    participants: raw.Participants?.map(p => ({
      jid: p.JID,
      isAdmin: p.IsAdmin,
      isSuperAdmin: p.IsSuperAdmin,
    })),
    announce: raw.IsAnnounce,
    locked: raw.IsLocked,
    ephemeral: raw.DisappearingTimer,
  }
}

export interface GroupListResponse {
  data: Group[]
}

export async function getGroups(sessionName: string): Promise<GroupListResponse> {
  const response = await apiRequest<{ data: GroupRaw[] }>(`/${sessionName}/group/list`)
  return {
    data: response.data?.map(mapGroup) || []
  }
}

export async function getGroupInfo(sessionName: string, jid: string): Promise<Group> {
  const raw = await apiRequest<GroupRaw>(`/${sessionName}/group/info?groupId=${encodeURIComponent(jid)}`)
  return mapGroup(raw)
}

export async function createGroup(sessionName: string, name: string, participants: string[]): Promise<Group> {
  return apiRequest<Group>(`/${sessionName}/group/create`, {
    method: 'POST',
    body: JSON.stringify({ name, participants }),
  })
}

export async function leaveGroup(sessionName: string, jid: string): Promise<void> {
  return apiRequest(`/${sessionName}/group/leave`, {
    method: 'POST',
    body: JSON.stringify({ groupId: jid }),
  })
}

export async function getGroupInviteLink(sessionName: string, jid: string): Promise<{ link: string }> {
  return apiRequest(`/${sessionName}/group/invitelink?groupId=${encodeURIComponent(jid)}`)
}

// ============================================================================
// MESSAGES API
// ============================================================================

export interface SendMessageResponse {
  id: string
  timestamp: string
}

export async function sendTextMessage(sessionName: string, phone: string, text: string): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionName}/message/send/text`, {
    method: 'POST',
    body: JSON.stringify({ phone, text }),
  })
}

export async function sendImageMessage(sessionName: string, phone: string, image: string, caption?: string): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionName}/message/send/image`, {
    method: 'POST',
    body: JSON.stringify({ phone, image, caption }),
  })
}

export async function sendDocumentMessage(sessionName: string, phone: string, document: string, filename: string, mimetype?: string): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionName}/message/send/document`, {
    method: 'POST',
    body: JSON.stringify({ phone, document, filename, mimetype }),
  })
}

export async function sendLocationMessage(sessionName: string, phone: string, latitude: number, longitude: number, name?: string): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>(`/${sessionName}/message/send/location`, {
    method: 'POST',
    body: JSON.stringify({ phone, latitude, longitude, name }),
  })
}

// ============================================================================
// MEDIA API
// ============================================================================

export interface MediaItem {
  id: string
  sessionId: string
  msgId: string
  mediaType: string
  mimeType?: string
  fileName?: string
  fileSize?: number
  chatJid?: string
  fromMe?: boolean
  caption?: string
  pushName?: string
  downloaded: boolean
  downloadError?: string
  downloadAttempts?: number
  storageUrl?: string
  thumbnailUrl?: string
  width?: number
  height?: number
  duration?: number
  createdAt: string
  updatedAt: string
}

export interface MediaListResponse {
  media: MediaItem[]
  count: number
  limit: number
  offset: number
}

export async function getMediaList(sessionName: string, chatJid?: string, type?: string, limit?: number, offset?: number): Promise<MediaListResponse> {
  const params = new URLSearchParams()
  if (chatJid) params.append('chat', chatJid)
  if (type) params.append('type', type)
  if (limit) params.append('limit', limit.toString())
  if (offset) params.append('offset', offset.toString())
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<MediaListResponse>(`/${sessionName}/media/list${query}`)
}

export interface PendingMediaResponse {
  media: MediaItem[]
  count: number
}

export async function getPendingMedia(sessionName: string): Promise<PendingMediaResponse> {
  return apiRequest<PendingMediaResponse>(`/${sessionName}/media/pending`)
}

export async function processMedia(sessionName: string, messageIds?: string[]): Promise<{ processed: number }> {
  return apiRequest(`/${sessionName}/media/process`, {
    method: 'POST',
    body: JSON.stringify({ messageIds }),
  })
}

export async function downloadMedia(sessionName: string, messageId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/${sessionName}/media/download?messageId=${encodeURIComponent(messageId)}`, {
    headers: {
      ...(API_KEY && { 'Authorization': API_KEY }),
    },
  })
  if (!response.ok) throw new Error('Failed to download media')
  return response.blob()
}

// ============================================================================
// PROFILE API
// ============================================================================

export interface Profile {
  jid: string
  name?: string
  status?: string
  pictureUrl?: string
}

export async function getProfile(sessionName: string): Promise<{ profile: Profile }> {
  return apiRequest(`/${sessionName}/profile`)
}

export async function setProfileName(sessionName: string, name: string): Promise<void> {
  return apiRequest(`/${sessionName}/profile/name`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function setProfileStatus(sessionName: string, status: string): Promise<void> {
  return apiRequest(`/${sessionName}/profile/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export async function setProfilePicture(sessionName: string, image: string): Promise<void> {
  return apiRequest(`/${sessionName}/profile/picture`, {
    method: 'POST',
    body: JSON.stringify({ image }),
  })
}

export async function removeProfilePicture(sessionName: string): Promise<void> {
  return apiRequest(`/${sessionName}/profile/picture/remove`, { method: 'POST' })
}

export interface PrivacySettings {
  groupAdd?: string
  lastSeen?: string
  status?: string
  profile?: string
  readReceipts?: string
}

export async function getPrivacySettings(sessionName: string): Promise<PrivacySettings> {
  return apiRequest(`/${sessionName}/profile/privacy`)
}

export async function setPrivacySettings(sessionName: string, settings: PrivacySettings): Promise<void> {
  return apiRequest(`/${sessionName}/profile/privacy`, {
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

export async function setDefaultDisappearingTimer(sessionName: string, duration: number): Promise<void> {
  return apiRequest(`/${sessionName}/profile/disappearing`, {
    method: 'POST',
    body: JSON.stringify({ duration }),
  })
}

// ============================================================================
// HISTORY API
// ============================================================================

export interface UnreadChat {
  jid: string
  name?: string
  unreadCount: number
  lastMessageTimestamp?: number
  markedAsUnread?: boolean
}

export async function getUnreadChats(sessionName: string): Promise<{ chats: UnreadChat[] }> {
  return apiRequest(`/${sessionName}/history/chats/unread`)
}
