const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// ============ Types ============

export interface Session {
  id: string;
  session: string;
  status: "connected" | "disconnected" | "connecting";
  deviceJid?: string;
  phone?: string;
  pushName?: string;
  profilePicture?: string;
  apiKey?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    messages: number;
    chats: number;
    contacts: number;
    groups: number;
  };
}

export interface QRResponse {
  qr?: string;
  status: string;
}

export interface CreateSessionRequest {
  session: string;
  apiKey?: string;
}

export interface Contact {
  jid: string;
  name?: string;
  pushName?: string;
  businessName?: string;
  phone?: string;
  profilePicture?: string;
  isGroup?: boolean;
  isBusiness?: boolean;
}

export interface BusinessProfile {
  jid: string;
  businessName?: string;
  description?: string;
  category?: string;
  email?: string;
  website?: string[];
  address?: string;
}

export interface Chat {
  jid: string;
  name?: string;
  pushName?: string;
  lastMessage?: Message;
  unreadCount?: number;
  isGroup?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  muteExpiration?: string;
  pinned?: boolean;
  updatedAt?: string;
}

export interface Message {
  id: string;
  chatJid: string;
  senderJid?: string;
  senderName?: string;
  content?: string;
  type: string;
  timestamp: string;
  isFromMe: boolean;
  status?: string;
  mediaUrl?: string;
  mediaType?: string;
  quotedMessage?: Message;
}

export interface Group {
  jid: string;
  name: string;
  topic?: string;
  owner?: string;
  createdAt?: string;
  participants?: GroupParticipant[];
  participantCount?: number;
  profilePicture?: string;
  isAnnounce?: boolean;
  isLocked?: boolean;
  isCommunity?: boolean;
  linkedParent?: string;
}

export interface GroupParticipant {
  jid: string;
  name?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export interface Media {
  id: string;
  messageId: string;
  sessionId: string;
  type: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  url?: string;
  storageKey?: string;
  status: string;
  createdAt: string;
}

export interface Webhook {
  id?: string;
  url: string;
  events?: string[];
  headers?: Record<string, string>;
  enabled?: boolean;
}

export interface Profile {
  jid?: string;
  name?: string;
  status?: string;
  profilePicture?: string;
}

export interface SendMessageRequest {
  to: string;
  text?: string;
  caption?: string;
  url?: string;
  base64?: string;
  fileName?: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  quoted?: string;
  mentions?: string[];
}

export interface PollOption {
  name: string;
}

export interface SendPollRequest {
  to: string;
  name: string;
  options: PollOption[];
  selectableCount?: number;
}

export interface Button {
  buttonId: string;
  buttonText: string;
  type?: number;
}

export interface SendButtonsRequest {
  to: string;
  text: string;
  footer?: string;
  buttons: Button[];
}

export interface ListSection {
  title: string;
  rows: { title: string; description?: string; rowId: string }[];
}

export interface SendListRequest {
  to: string;
  title: string;
  text: string;
  footer?: string;
  buttonText: string;
  sections: ListSection[];
}

export interface Newsletter {
  jid: string;
  name: string;
  description?: string;
  subscriberCount?: number;
  picture?: string;
  state?: string;
}

export interface Settings {
  readReceipts?: boolean;
  pushName?: string;
  online?: boolean;
}

// ============ Chatwoot Types ============

export interface ChatwootConfig {
  enabled: boolean;
  baseUrl: string;
  apiAccessToken: string;
  accountId: number;
  inboxId: number;
  conversationId?: number;
}

export interface ChatwootSyncStatus {
  status: string;
  progress: number;
  contactsSynced: number;
  messagesSynced: number;
  lastSyncAt?: string;
  error?: string;
}

export interface ChatwootOverview {
  contactsCount: number;
  conversationsCount: number;
  lastSyncAt?: string;
}

export interface ChatwootStats {
  open: number;
  resolved: number;
  pending: number;
  snoozed: number;
}

// ============ API Client ============

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(API_KEY && { Authorization: API_KEY }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error(`API returned non-JSON response. Is the backend running at ${API_URL}?`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============ Sessions ============

export async function getSessions(): Promise<Session[]> {
  return fetchApi<Session[]>("/sessions");
}

export async function getSession(name: string): Promise<Session> {
  return fetchApi<Session>(`/${name}/status`);
}

export async function createSession(data: CreateSessionRequest): Promise<Session> {
  return fetchApi<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteSession(name: string): Promise<void> {
  await fetchApi(`/${name}`, { method: "DELETE" });
}

export async function connectSession(name: string): Promise<{ message: string; status: string }> {
  return fetchApi(`/${name}/connect`, { method: "POST" });
}

export async function disconnectSession(name: string): Promise<void> {
  await fetchApi(`/${name}/disconnect`, { method: "POST" });
}

export async function logoutSession(name: string): Promise<void> {
  await fetchApi(`/${name}/logout`, { method: "POST" });
}

export async function restartSession(name: string): Promise<Session> {
  return fetchApi<Session>(`/${name}/restart`, { method: "POST" });
}

export async function getQR(name: string): Promise<QRResponse> {
  return fetchApi<QRResponse>(`/${name}/qr`);
}

export async function pairPhone(name: string, phone: string): Promise<{ code: string }> {
  return fetchApi(`/${name}/pairphone`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

// ============ Profile ============

export async function getProfile(session: string): Promise<Profile> {
  return fetchApi<Profile>(`/${session}/profile`);
}

export async function setProfileStatus(session: string, status: string): Promise<void> {
  await fetchApi(`/${session}/profile/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function setProfileName(session: string, name: string): Promise<void> {
  await fetchApi(`/${session}/profile/name`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function setProfilePicture(session: string, url: string): Promise<void> {
  await fetchApi(`/${session}/profile/picture`, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function deleteProfilePicture(session: string): Promise<void> {
  await fetchApi(`/${session}/profile/picture/remove`, { method: "POST" });
}

// ============ Settings ============

export async function getSettings(session: string): Promise<Settings> {
  return fetchApi<Settings>(`/${session}/settings`);
}

export async function updateSettings(session: string, settings: Partial<Settings>): Promise<void> {
  await fetchApi(`/${session}/settings`, {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

// ============ Contacts ============

export async function getContacts(session: string): Promise<Contact[]> {
  return fetchApi<Contact[]>(`/${session}/contact/list`);
}

export async function checkPhone(session: string, phones: string[]): Promise<{ exists: boolean; jid: string }[]> {
  return fetchApi(`/${session}/contact/check`, {
    method: "POST",
    body: JSON.stringify({ phones }),
  });
}

export async function getContactInfo(session: string, jid: string): Promise<Contact> {
  return fetchApi<Contact>(`/${session}/contact/info?jid=${encodeURIComponent(jid)}`);
}

export async function getAvatar(session: string, jid: string): Promise<{ url: string }> {
  return fetchApi(`/${session}/contact/avatar?jid=${encodeURIComponent(jid)}`);
}

export async function getBlocklist(session: string): Promise<string[]> {
  return fetchApi<string[]>(`/${session}/contact/blocklist`);
}

export async function updateBlocklist(session: string, jid: string, action: "block" | "unblock"): Promise<void> {
  await fetchApi(`/${session}/contact/blocklist`, {
    method: "POST",
    body: JSON.stringify({ jid, action }),
  });
}

export async function getBusinessProfile(session: string, jid: string): Promise<BusinessProfile> {
  return fetchApi<BusinessProfile>(`/${session}/contact/business?jid=${encodeURIComponent(jid)}`);
}

export async function getContactLID(session: string, jid: string): Promise<{ lid: string }> {
  return fetchApi(`/${session}/contact/lid?jid=${encodeURIComponent(jid)}`);
}

export async function getContactQRLink(session: string, jid: string): Promise<{ link: string }> {
  return fetchApi(`/${session}/contact/qrlink?jid=${encodeURIComponent(jid)}`);
}

// ============ Presence ============

export async function setPresence(session: string, presence: "available" | "unavailable"): Promise<void> {
  await fetchApi(`/${session}/presence`, {
    method: "POST",
    body: JSON.stringify({ presence }),
  });
}

export async function subscribePresence(session: string, jid: string): Promise<void> {
  await fetchApi(`/${session}/presence/subscribe`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  });
}

// ============ Chats ============

export async function getChats(session: string): Promise<Chat[]> {
  return fetchApi<Chat[]>(`/${session}/chat/list`);
}

export async function getChatInfo(session: string, jid: string): Promise<Chat> {
  return fetchApi<Chat>(`/${session}/chat/info?jid=${encodeURIComponent(jid)}`);
}

export async function getChatMessages(session: string, jid: string, limit = 50): Promise<Message[]> {
  return fetchApi<Message[]>(`/${session}/chat/messages?jid=${encodeURIComponent(jid)}&limit=${limit}`);
}

export async function setChatPresence(session: string, jid: string, presence: "composing" | "paused" | "recording"): Promise<void> {
  await fetchApi(`/${session}/chat/presence`, {
    method: "POST",
    body: JSON.stringify({ jid, presence }),
  });
}

export async function markRead(session: string, jid: string, messageIds?: string[]): Promise<void> {
  await fetchApi(`/${session}/chat/markread`, {
    method: "POST",
    body: JSON.stringify({ jid, messageIds }),
  });
}

export async function markChatUnread(session: string, jid: string): Promise<void> {
  await fetchApi(`/${session}/chat/unread`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  });
}

export async function archiveChat(session: string, jid: string, archive: boolean): Promise<void> {
  await fetchApi(`/${session}/chat/archive`, {
    method: "POST",
    body: JSON.stringify({ jid, archive }),
  });
}

export async function setDisappearingTimer(session: string, jid: string, duration: number): Promise<void> {
  await fetchApi(`/${session}/chat/disappearing`, {
    method: "POST",
    body: JSON.stringify({ jid, duration }),
  });
}

export async function deleteMessage(session: string, jid: string, messageId: string, forEveryone = false): Promise<void> {
  await fetchApi(`/${session}/message/delete`, {
    method: "POST",
    body: JSON.stringify({ jid, messageId, forEveryone }),
  });
}

export async function editMessage(session: string, jid: string, messageId: string, text: string): Promise<void> {
  await fetchApi(`/${session}/message/edit`, {
    method: "POST",
    body: JSON.stringify({ jid, messageId, text }),
  });
}

// ============ Messages ============

export async function sendTextMessage(session: string, data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/text`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendImageMessage(session: string, data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/image`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendAudioMessage(session: string, data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/audio`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendVideoMessage(session: string, data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/video`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendDocumentMessage(session: string, data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/document`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendStickerMessage(session: string, data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/sticker`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendLocationMessage(session: string, data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/location`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendContactMessage(session: string, to: string, contact: { name: string; phone: string }): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/contact`, {
    method: "POST",
    body: JSON.stringify({ to, contact }),
  });
}

export async function sendPollMessage(session: string, data: SendPollRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/poll`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendButtonsMessage(session: string, data: SendButtonsRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/buttons`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendListMessage(session: string, data: SendListRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/list`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendReaction(session: string, jid: string, messageId: string, emoji: string): Promise<void> {
  await fetchApi(`/${session}/message/react`, {
    method: "POST",
    body: JSON.stringify({ jid, messageId, emoji }),
  });
}

export async function sendPollVote(session: string, jid: string, messageId: string, options: string[]): Promise<void> {
  await fetchApi(`/${session}/message/poll/vote`, {
    method: "POST",
    body: JSON.stringify({ jid, messageId, options }),
  });
}

// ============ Groups ============

export async function getGroups(session: string): Promise<Group[]> {
  return fetchApi<Group[]>(`/${session}/group/list`);
}

export async function getGroupInfo(session: string, jid: string): Promise<Group> {
  return fetchApi<Group>(`/${session}/group/info?jid=${encodeURIComponent(jid)}`);
}

export async function createGroup(session: string, name: string, participants: string[]): Promise<Group> {
  return fetchApi<Group>(`/${session}/group/create`, {
    method: "POST",
    body: JSON.stringify({ name, participants }),
  });
}

export async function leaveGroup(session: string, jid: string): Promise<void> {
  await fetchApi(`/${session}/group/leave`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  });
}

export async function updateGroupName(session: string, jid: string, name: string): Promise<void> {
  await fetchApi(`/${session}/group/name`, {
    method: "POST",
    body: JSON.stringify({ jid, name }),
  });
}

export async function updateGroupTopic(session: string, jid: string, topic: string): Promise<void> {
  await fetchApi(`/${session}/group/topic`, {
    method: "POST",
    body: JSON.stringify({ jid, topic }),
  });
}

export async function setGroupPicture(session: string, jid: string, url: string): Promise<void> {
  await fetchApi(`/${session}/group/photo`, {
    method: "POST",
    body: JSON.stringify({ jid, url }),
  });
}

export async function deleteGroupPicture(session: string, jid: string): Promise<void> {
  await fetchApi(`/${session}/group/photo/remove`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  });
}

export async function getGroupPicture(session: string, jid: string): Promise<{ url: string }> {
  return fetchApi(`/${session}/group/avatar?jid=${encodeURIComponent(jid)}`);
}

export async function addGroupParticipants(session: string, jid: string, participants: string[]): Promise<void> {
  await fetchApi(`/${session}/group/participants/add`, {
    method: "POST",
    body: JSON.stringify({ jid, participants }),
  });
}

export async function removeGroupParticipants(session: string, jid: string, participants: string[]): Promise<void> {
  await fetchApi(`/${session}/group/participants/remove`, {
    method: "POST",
    body: JSON.stringify({ jid, participants }),
  });
}

export async function promoteParticipants(session: string, jid: string, participants: string[]): Promise<void> {
  await fetchApi(`/${session}/group/participants/promote`, {
    method: "POST",
    body: JSON.stringify({ jid, participants }),
  });
}

export async function demoteParticipants(session: string, jid: string, participants: string[]): Promise<void> {
  await fetchApi(`/${session}/group/participants/demote`, {
    method: "POST",
    body: JSON.stringify({ jid, participants }),
  });
}

export async function setGroupAnnounce(session: string, jid: string, announce: boolean): Promise<void> {
  await fetchApi(`/${session}/group/announce`, {
    method: "POST",
    body: JSON.stringify({ jid, announce }),
  });
}

export async function setGroupLocked(session: string, jid: string, locked: boolean): Promise<void> {
  await fetchApi(`/${session}/group/locked`, {
    method: "POST",
    body: JSON.stringify({ jid, locked }),
  });
}

export async function setGroupApprovalMode(session: string, jid: string, enabled: boolean): Promise<void> {
  await fetchApi(`/${session}/group/approval`, {
    method: "POST",
    body: JSON.stringify({ jid, enabled }),
  });
}

export async function getGroupInviteLink(session: string, jid: string): Promise<{ link: string }> {
  return fetchApi(`/${session}/group/invitelink?jid=${encodeURIComponent(jid)}`);
}

export async function getGroupInfoFromLink(session: string, link: string): Promise<Group> {
  return fetchApi<Group>(`/${session}/group/inviteinfo?link=${encodeURIComponent(link)}`);
}

export async function joinGroup(session: string, link: string): Promise<{ jid: string }> {
  return fetchApi(`/${session}/group/join`, {
    method: "POST",
    body: JSON.stringify({ link }),
  });
}

export async function getGroupRequests(session: string, jid: string): Promise<{ jid: string; reason?: string }[]> {
  return fetchApi(`/${session}/group/requests?jid=${encodeURIComponent(jid)}`);
}

export async function handleGroupRequest(session: string, jid: string, participant: string, action: "approve" | "reject"): Promise<void> {
  await fetchApi(`/${session}/group/requests/action`, {
    method: "POST",
    body: JSON.stringify({ jid, participant, action }),
  });
}

// ============ Media ============

export async function getMediaList(session: string, limit = 50): Promise<Media[]> {
  return fetchApi<Media[]>(`/${session}/media/list?limit=${limit}`);
}

export async function getPendingMedia(session: string): Promise<Media[]> {
  return fetchApi<Media[]>(`/${session}/media/pending`);
}

export async function processMedia(session: string, mediaId: string): Promise<void> {
  await fetchApi(`/${session}/media/process`, {
    method: "POST",
    body: JSON.stringify({ mediaId }),
  });
}

export async function retryMediaDownload(session: string, mediaId: string): Promise<void> {
  await fetchApi(`/${session}/media/retry`, {
    method: "POST",
    body: JSON.stringify({ mediaId }),
  });
}

export function getMediaStreamUrl(session: string, mediaId: string): string {
  return `${API_URL}/${session}/media/stream?id=${mediaId}&auth=${API_KEY}`;
}

export function getPublicMediaUrl(session: string, mediaId: string): string {
  return `${API_URL}/public/${session}/media/stream?id=${mediaId}`;
}

// ============ Newsletters ============

export async function getNewsletters(session: string): Promise<Newsletter[]> {
  return fetchApi<Newsletter[]>(`/${session}/newsletter/list`);
}

export async function getNewsletterInfo(session: string, jid: string): Promise<Newsletter> {
  return fetchApi<Newsletter>(`/${session}/newsletter/info?jid=${encodeURIComponent(jid)}`);
}

export async function createNewsletter(session: string, name: string, description?: string): Promise<Newsletter> {
  return fetchApi<Newsletter>(`/${session}/newsletter/create`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function followNewsletter(session: string, jid: string): Promise<void> {
  await fetchApi(`/${session}/newsletter/follow`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  });
}

export async function unfollowNewsletter(session: string, jid: string): Promise<void> {
  await fetchApi(`/${session}/newsletter/unfollow`, {
    method: "POST",
    body: JSON.stringify({ jid }),
  });
}

export async function getNewsletterMessages(session: string, jid: string, limit = 50): Promise<Message[]> {
  return fetchApi<Message[]>(`/${session}/newsletter/messages?jid=${encodeURIComponent(jid)}&limit=${limit}`);
}

// ============ Webhooks ============

export async function getWebhook(session: string): Promise<Webhook | null> {
  try {
    return await fetchApi<Webhook>(`/${session}/webhook`);
  } catch {
    return null;
  }
}

export async function setWebhook(session: string, webhook: Webhook): Promise<Webhook> {
  return fetchApi<Webhook>(`/${session}/webhook`, {
    method: "POST",
    body: JSON.stringify(webhook),
  });
}

export async function updateWebhook(session: string, webhook: Partial<Webhook>): Promise<Webhook> {
  return fetchApi<Webhook>(`/${session}/webhook`, {
    method: "PUT",
    body: JSON.stringify(webhook),
  });
}

export async function deleteWebhook(session: string): Promise<void> {
  await fetchApi(`/${session}/webhook`, { method: "DELETE" });
}

// ============ Chatwoot Integration ============

export async function validateChatwootCredentials(baseUrl: string, apiAccessToken: string): Promise<{ valid: boolean; account?: { id: number; name: string } }> {
  return fetchApi(`/chatwoot/validate`, {
    method: "POST",
    body: JSON.stringify({ baseUrl, apiAccessToken }),
  });
}

export async function getChatwootConfig(session: string): Promise<ChatwootConfig | null> {
  try {
    return await fetchApi<ChatwootConfig>(`/sessions/${session}/chatwoot/find`);
  } catch {
    return null;
  }
}

export async function setChatwootConfig(session: string, config: Omit<ChatwootConfig, "enabled">): Promise<ChatwootConfig> {
  return fetchApi<ChatwootConfig>(`/sessions/${session}/chatwoot/set`, {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function deleteChatwootConfig(session: string): Promise<void> {
  await fetchApi(`/sessions/${session}/chatwoot`, { method: "DELETE" });
}

export async function syncChatwoot(session: string): Promise<{ message: string }> {
  return fetchApi(`/sessions/${session}/chatwoot/sync`, { method: "POST" });
}

export async function syncChatwootContacts(session: string): Promise<{ message: string }> {
  return fetchApi(`/sessions/${session}/chatwoot/sync/contacts`, { method: "POST" });
}

export async function syncChatwootMessages(session: string): Promise<{ message: string }> {
  return fetchApi(`/sessions/${session}/chatwoot/sync/messages`, { method: "POST" });
}

export async function getChatwootSyncStatus(session: string): Promise<ChatwootSyncStatus> {
  return fetchApi<ChatwootSyncStatus>(`/sessions/${session}/chatwoot/sync/status`);
}

export async function getChatwootOverview(session: string): Promise<ChatwootOverview> {
  return fetchApi<ChatwootOverview>(`/sessions/${session}/chatwoot/overview`);
}

export async function resolveAllChatwootConversations(session: string): Promise<{ resolved: number }> {
  return fetchApi(`/sessions/${session}/chatwoot/resolve-all`, { method: "POST" });
}

export async function getChatwootConversationStats(session: string): Promise<ChatwootStats> {
  return fetchApi<ChatwootStats>(`/sessions/${session}/chatwoot/conversations/stats`);
}

export async function resetChatwoot(session: string): Promise<{ message: string }> {
  return fetchApi(`/sessions/${session}/chatwoot/reset`, { method: "POST" });
}

// ============ Calls ============

export async function rejectCall(session: string, callId: string, from: string): Promise<void> {
  await fetchApi(`/${session}/call/reject`, {
    method: "POST",
    body: JSON.stringify({ callId, from }),
  });
}
