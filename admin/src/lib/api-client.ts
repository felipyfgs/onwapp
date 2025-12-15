"use client";

import { API_BASE_URL, API_KEY } from "@/lib/constants";

interface ApiError extends Error {
  status?: number;
  data?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": API_KEY,
  });

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url.toString(), config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred");
  }
}

// API completo com todas as funções
export const api = {
  // ========== SESSÕES ==========
  getSessions: () => apiRequest<any[]>("/sessions"),
  createSession: (data: any) => apiRequest("/sessions", "POST", data),
  getSessionStatus: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/status`),
  deleteSession: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}`, "DELETE"),
  connectSession: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/connect`, "POST"),
  disconnectSession: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/disconnect`, "POST"),
  logoutSession: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/logout`, "POST"),
  restartSession: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/restart`, "POST"),
  getSessionQR: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/qr`),
  pairPhone: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/pairphone`, "POST", data),

  // ========== PROFILE ==========
  getProfile: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/profile`),
  setStatus: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/profile/status`, "POST", data),
  setPushName: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/profile/name`, "POST", data),
  setProfilePicture: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/profile/picture`, "POST", data),
  deleteProfilePicture: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/profile/picture/remove`, "POST"),

  // ========== SETTINGS ==========
  getSettings: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/settings`),
  updateSettings: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/settings`, "POST", data),

  // ========== CONTACTS ==========
  getContacts: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/contact/list`),
  checkPhone: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/contact/check`, "POST", data),
  getBlocklist: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/contact/blocklist`),
  updateBlocklist: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/contact/blocklist`, "POST", data),
  getContactInfo: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/contact/info`, "POST", data),
  getAvatar: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/contact/avatar`, "GET", undefined, params),
  getBusinessProfile: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/contact/business`, "GET", undefined, params),
  getContactLID: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/contact/lid`, "GET", undefined, params),
  getContactQRLink: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/contact/qrlink`, "GET", undefined, params),

  // ========== PRESENCE ==========
  setPresence: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/presence`, "POST", data),
  subscribePresence: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/presence/subscribe`, "POST", data),

  // ========== CHATS ==========
  setChatPresence: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/chat/presence`, "POST", data),
  markRead: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/chat/markread`, "POST", data),
  markChatUnread: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/chat/unread`, "POST", data),
  archiveChat: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/chat/archive`, "POST", data),
  setDisappearingTimer: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/chat/disappearing`, "POST", data),
  getAllChats: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/chat/list`),
  getChatMessages: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/chat/messages`, "GET", undefined, params),
  getChatInfo: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/chat/info`, "GET", undefined, params),

  // ========== MESSAGES ==========
  sendText: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/text`, "POST", data),
  sendImage: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/image`, "POST", data),
  sendAudio: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/audio`, "POST", data),
  sendVideo: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/video`, "POST", data),
  sendDocument: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/document`, "POST", data),
  sendSticker: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/sticker`, "POST", data),
  sendLocation: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/location`, "POST", data),
  sendContact: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/contact`, "POST", data),
  sendPoll: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/poll`, "POST", data),
  sendButtons: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/buttons`, "POST", data),
  sendList: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/list`, "POST", data),
  sendInteractive: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/interactive`, "POST", data),
  sendTemplate: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/template`, "POST", data),
  sendCarousel: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/send/carousel`, "POST", data),
  sendReaction: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/react`, "POST", data),
  deleteMessage: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/delete`, "POST", data),
  editMessage: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/edit`, "POST", data),
  sendPollVote: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/poll/vote`, "POST", data),
  requestUnavailableMessage: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/message/request-unavailable`, "POST", data),

  // ========== GROUPS ==========
  createGroup: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/create`, "POST", data),
  getJoinedGroups: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/group/list`),
  getGroupInfo: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/group/info`, "GET", undefined, params),
  leaveGroup: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/leave`, "POST", data),
  updateGroupName: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/name`, "POST", data),
  updateGroupTopic: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/topic`, "POST", data),
  setGroupPicture: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/photo`, "POST", data),
  deleteGroupPicture: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/photo/remove`, "POST", data),
  getGroupPicture: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/group/avatar`, "GET", undefined, params),
  addParticipants: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/participants/add`, "POST", data),
  removeParticipants: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/participants/remove`, "POST", data),
  promoteParticipants: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/participants/promote`, "POST", data),
  demoteParticipants: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/participants/demote`, "POST", data),
  setGroupAnnounce: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/announce`, "POST", data),
  setGroupLocked: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/locked`, "POST", data),
  setGroupApprovalMode: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/approval`, "POST", data),
  setGroupMemberAddMode: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/memberadd`, "POST", data),
  getInviteLink: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/group/invitelink`, "GET", undefined, params),
  getGroupInfoFromLink: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/group/inviteinfo`, "GET", undefined, params),
  joinGroup: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/join`, "POST", data),
  getGroupRequestParticipants: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/group/requests`, "GET", undefined, params),
  updateGroupRequestParticipants: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/requests/action`, "POST", data),
  sendGroupMessage: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/group/send/text`, "POST", data),

  // ========== COMMUNITY ==========
  getSubGroups: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/community/groups`, "GET", undefined, params),
  linkGroup: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/community/link`, "POST", data),
  unlinkGroup: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/community/unlink`, "POST", data),

  // ========== MEDIA ==========
  listMedia: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/media/list`, "GET", undefined, params),
  listPendingMedia: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/media/pending`),
  processPendingMedia: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/media/process`, "POST", data),
  retryMediaDownload: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/media/retry`, "POST", data),
  getMedia: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/media/download`, "GET", undefined, params),
  streamMedia: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/media/stream`, "GET", undefined, params),

  // ========== NEWSLETTER ==========
  createNewsletter: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/create`, "POST", data),
  getSubscribedNewsletters: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/newsletter/list`),
  getNewsletterInfo: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/info`, "GET", undefined, params),
  followNewsletter: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/follow`, "POST", data),
  unfollowNewsletter: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/unfollow`, "POST", data),
  getNewsletterMessages: (sessionId: string, params?: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/messages`, "GET", undefined, params),
  newsletterSendReaction: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/react`, "POST", data),
  newsletterToggleMute: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/mute`, "POST", data),
  newsletterMarkViewed: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/viewed`, "POST", data),
  newsletterSubscribeLiveUpdates: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/newsletter/subscribe-live`, "POST", data),

  // ========== STATUS ==========
  sendStory: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/status/send`, "POST", data),
  getStatusPrivacy: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/status/privacy`),

  // ========== CALL ==========
  rejectCall: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/call/reject`, "POST", data),

  // ========== WEBHOOKS ==========
  getWebhook: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/webhook`),
  setWebhook: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/webhook`, "POST", data),
  updateWebhook: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/webhook`, "PUT", data),
  deleteWebhook: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/webhook`, "DELETE"),
  getWebhookEvents: () => apiRequest("/events"),

  // ========== CHATWOOT ==========
  getChatwootConfig: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/chatwoot/find`),
  setChatwootConfig: (sessionId: string, data: any) =>
    apiRequest(`/sessions/${sessionId}/chatwoot/set`, "POST", data),
  validateChatwootCredentials: (data: any) =>
    apiRequest("/chatwoot/validate", "POST", data),
  syncChatwootContacts: (sessionId: string, days?: number) =>
    apiRequest(
      `/sessions/${sessionId}/chatwoot/sync/contacts`,
      "POST",
      undefined,
      days ? { days: days.toString() } : undefined
    ),
  syncChatwootMessages: (sessionId: string, days?: number) =>
    apiRequest(
      `/sessions/${sessionId}/chatwoot/sync/messages`,
      "POST",
      undefined,
      days ? { days: days.toString() } : undefined
    ),
  syncChatwootAll: (sessionId: string, days?: number) =>
    apiRequest(
      `/sessions/${sessionId}/chatwoot/sync`,
      "POST",
      undefined,
      days ? { days: days.toString() } : undefined
    ),
  getChatwootSyncStatus: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/chatwoot/sync/status`),
  getChatwootOverview: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/chatwoot/overview`),
  resolveAllChatwootConversations: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/chatwoot/resolve-all`, "POST"),
  getChatwootConversationsStats: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/chatwoot/conversations/stats`),
  resetChatwoot: (sessionId: string) =>
    apiRequest(`/sessions/${sessionId}/chatwoot/reset`, "POST"),
};