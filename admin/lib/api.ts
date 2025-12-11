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

// ============ Chats ============

export async function getChats(session: string): Promise<Chat[]> {
  return fetchApi<Chat[]>(`/${session}/chat/list`);
}

export async function getChatMessages(session: string, jid: string, limit = 50): Promise<Message[]> {
  return fetchApi<Message[]>(`/${session}/chat/messages?jid=${encodeURIComponent(jid)}&limit=${limit}`);
}

export async function markRead(session: string, jid: string, messageIds?: string[]): Promise<void> {
  await fetchApi(`/${session}/chat/markread`, {
    method: "POST",
    body: JSON.stringify({ jid, messageIds }),
  });
}

export async function archiveChat(session: string, jid: string, archive: boolean): Promise<void> {
  await fetchApi(`/${session}/chat/archive`, {
    method: "POST",
    body: JSON.stringify({ jid, archive }),
  });
}

export async function deleteMessage(session: string, jid: string, messageId: string, forEveryone = false): Promise<void> {
  await fetchApi(`/${session}/message/delete`, {
    method: "POST",
    body: JSON.stringify({ jid, messageId, forEveryone }),
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

export async function sendLocationMessage(session: string, data: SendMessageRequest): Promise<Message> {
  return fetchApi<Message>(`/${session}/message/send/location`, {
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

export async function getGroupInviteLink(session: string, jid: string): Promise<{ link: string }> {
  return fetchApi(`/${session}/group/invitelink?jid=${encodeURIComponent(jid)}`);
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

export async function getMediaUrl(session: string, mediaId: string): Promise<string> {
  return `${API_URL}/${session}/media/stream?id=${mediaId}`;
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
