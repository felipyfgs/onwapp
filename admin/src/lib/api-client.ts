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

// Funções específicas para cada endpoint
export const api = {
  // Sessões
  getSessions: () => apiRequest<Session[]>("/sessions"),
  createSession: (data: any) => apiRequest<Session>("/sessions", "POST", data),
  getSessionStatus: (sessionId: string) =>
    apiRequest<SessionStatus>(`/${sessionId}/status`),
  deleteSession: (sessionId: string) =>
    apiRequest<void>(`/${sessionId}`, "DELETE"),
  connectSession: (sessionId: string) =>
    apiRequest<void>(`/${sessionId}/connect`, "POST"),
  disconnectSession: (sessionId: string) =>
    apiRequest<void>(`/${sessionId}/disconnect`, "POST"),
  logoutSession: (sessionId: string) =>
    apiRequest<void>(`/${sessionId}/logout`, "POST"),
  restartSession: (sessionId: string) =>
    apiRequest<void>(`/${sessionId}/restart`, "POST"),
  getSessionQR: (sessionId: string) => apiRequest<QRResponse>(`/${sessionId}/qr`),
  pairPhone: (sessionId: string, data: any) =>
    apiRequest<void>(`/${sessionId}/pairphone`, "POST", data),

  // Webhooks
  getWebhook: (sessionId: string) =>
    apiRequest<WebhookResponse>(`/${sessionId}/webhook`),
  setWebhook: (sessionId: string, data: any) =>
    apiRequest<WebhookResponse>(`/${sessionId}/webhook`, "POST", data),
  updateWebhook: (sessionId: string, data: any) =>
    apiRequest<WebhookResponse>(`/${sessionId}/webhook`, "PUT", data),
  deleteWebhook: (sessionId: string) =>
    apiRequest<void>(`/${sessionId}/webhook`, "DELETE"),
  getWebhookEvents: () => apiRequest<WebhookEventsResponse>("/events"),

  // Chatwoot
  getChatwootConfig: (sessionId: string) =>
    apiRequest<ChatwootConfig>(`/sessions/${sessionId}/chatwoot/find`),
  setChatwootConfig: (sessionId: string, data: any) =>
    apiRequest<ChatwootConfig>(
      `/sessions/${sessionId}/chatwoot/set`,
      "POST",
      data
    ),
  validateChatwootCredentials: (data: any) =>
    apiRequest<ValidationResult>("/chatwoot/validate", "POST", data),
  syncChatwootContacts: (sessionId: string, days?: number) =>
    apiRequest<SyncStatus>(
      `/sessions/${sessionId}/chatwoot/sync/contacts`,
      "POST",
      undefined,
      days ? { days: days.toString() } : undefined
    ),
  syncChatwootMessages: (sessionId: string, days?: number) =>
    apiRequest<SyncStatus>(
      `/sessions/${sessionId}/chatwoot/sync/messages`,
      "POST",
      undefined,
      days ? { days: days.toString() } : undefined
    ),
  syncChatwootAll: (sessionId: string, days?: number) =>
    apiRequest<SyncStatus>(
      `/sessions/${sessionId}/chatwoot/sync`,
      "POST",
      undefined,
      days ? { days: days.toString() } : undefined
    ),
  getChatwootSyncStatus: (sessionId: string) =>
    apiRequest<SyncStatus>(`/sessions/${sessionId}/chatwoot/sync/status`),
  getChatwootOverview: (sessionId: string) =>
    apiRequest<ChatwootOverview>(`/sessions/${sessionId}/chatwoot/overview`),
  resolveAllChatwootConversations: (sessionId: string) =>
    apiRequest<void>(`/sessions/${sessionId}/chatwoot/resolve-all`, "POST"),
  getChatwootConversationsStats: (sessionId: string) =>
    apiRequest<ConversationsStats>(
      `/sessions/${sessionId}/chatwoot/conversations/stats`
    ),
  resetChatwoot: (sessionId: string) =>
    apiRequest<void>(`/sessions/${sessionId}/chatwoot/reset`, "POST"),
};

// Tipos de dados
interface Session {
  id: string;
  session: string;
  status: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
  device?: {
    platform: string;
    pushName: string;
    jid: string;
  };
  stats?: {
    messages: number;
    chats: number;
    contacts: number;
    groups: number;
  };
}

interface SessionStatus {
  status: string;
  device?: {
    platform: string;
    pushName: string;
    jid: string;
  };
}

interface QRResponse {
  qr: string;
  code: string;
}

interface WebhookResponse {
  id: string;
  sessionId: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret?: string;
  createdAt: string;
  updatedAt: string;
}

interface WebhookEventsResponse {
  categories: Record<string, string[]>;
  all: string[];
}

interface ChatwootConfig {
  enabled: boolean;
  url: string;
  token: string;
  account: number;
  inboxId: number;
  inbox?: string;
  signAgent: boolean;
  signSeparator: string;
  autoReopen: boolean;
  startPending: boolean;
  mergeBrPhones: boolean;
  syncContacts: boolean;
  syncMessages: boolean;
  syncDays: number;
  ignoreChats: string[];
  autoCreate: boolean;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  inboxes?: {
    id: number;
    name: string;
  }[];
}

interface SyncStatus {
  status: string;
  progress?: number;
  message?: string;
  error?: string;
}

interface ChatwootOverview {
  whatsapp: {
    contacts: number;
  };
  chatwoot: {
    contacts: number;
    conversations: number;
    messages: number;
  };
}

interface ConversationsStats {
  open: number;
}