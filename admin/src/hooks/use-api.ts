"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi<T>(initialData: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    error: null,
    loading: false,
  });

  const execute = useCallback(
    async (promise: Promise<T>): Promise<T> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await promise;
        setState({ data, error: null, loading: false });
        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState({ data: null, error: errorMessage, loading: false });
        throw error;
      }
    },
    []
  );

  return {
    ...state,
    execute,
  };
}

export function useSessions() {
  const { data: sessions, loading, error, execute } = useApi<Session[]>([]);

  const fetchSessions = useCallback(async () => {
    return execute(api.getSessions());
  }, [execute]);

  const createSession = useCallback(
    async (data: any) => {
      return execute(api.createSession(data));
    },
    [execute]
  );

  const getSessionStatus = useCallback(
    async (sessionId: string) => {
      return execute(api.getSessionStatus(sessionId));
    },
    [execute]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      return execute(api.deleteSession(sessionId));
    },
    [execute]
  );

  const connectSession = useCallback(
    async (sessionId: string) => {
      return execute(api.connectSession(sessionId));
    },
    [execute]
  );

  const disconnectSession = useCallback(
    async (sessionId: string) => {
      return execute(api.disconnectSession(sessionId));
    },
    [execute]
  );

  const logoutSession = useCallback(
    async (sessionId: string) => {
      return execute(api.logoutSession(sessionId));
    },
    [execute]
  );

  const restartSession = useCallback(
    async (sessionId: string) => {
      return execute(api.restartSession(sessionId));
    },
    [execute]
  );

  const getSessionQR = useCallback(
    async (sessionId: string) => {
      return execute(api.getSessionQR(sessionId));
    },
    [execute]
  );

  const pairPhone = useCallback(
    async (sessionId: string, data: any) => {
      return execute(api.pairPhone(sessionId, data));
    },
    [execute]
  );

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    getSessionStatus,
    deleteSession,
    connectSession,
    disconnectSession,
    logoutSession,
    restartSession,
    getSessionQR,
    pairPhone,
  };
}

export function useWebhooks() {
  const { data: webhook, loading, error, execute } = useApi<WebhookResponse>();

  const getWebhook = useCallback(
    async (sessionId: string) => {
      return execute(api.getWebhook(sessionId));
    },
    [execute]
  );

  const setWebhook = useCallback(
    async (sessionId: string, data: any) => {
      return execute(api.setWebhook(sessionId, data));
    },
    [execute]
  );

  const updateWebhook = useCallback(
    async (sessionId: string, data: any) => {
      return execute(api.updateWebhook(sessionId, data));
    },
    [execute]
  );

  const deleteWebhook = useCallback(
    async (sessionId: string) => {
      return execute(api.deleteWebhook(sessionId));
    },
    [execute]
  );

  const getWebhookEvents = useCallback(async () => {
    return execute(api.getWebhookEvents());
  }, [execute]);

  return {
    webhook,
    loading,
    error,
    getWebhook,
    setWebhook,
    updateWebhook,
    deleteWebhook,
    getWebhookEvents,
  };
}

export function useChatwoot() {
  const { data: chatwootConfig, loading, error, execute } =
    useApi<ChatwootConfig>();

  const getChatwootConfig = useCallback(
    async (sessionId: string) => {
      return execute(api.getChatwootConfig(sessionId));
    },
    [execute]
  );

  const setChatwootConfig = useCallback(
    async (sessionId: string, data: any) => {
      return execute(api.setChatwootConfig(sessionId, data));
    },
    [execute]
  );

  const validateChatwootCredentials = useCallback(
    async (data: any) => {
      return execute(api.validateChatwootCredentials(data));
    },
    [execute]
  );

  const syncChatwootContacts = useCallback(
    async (sessionId: string, days?: number) => {
      return execute(api.syncChatwootContacts(sessionId, days));
    },
    [execute]
  );

  const syncChatwootMessages = useCallback(
    async (sessionId: string, days?: number) => {
      return execute(api.syncChatwootMessages(sessionId, days));
    },
    [execute]
  );

  const syncChatwootAll = useCallback(
    async (sessionId: string, days?: number) => {
      return execute(api.syncChatwootAll(sessionId, days));
    },
    [execute]
  );

  const getChatwootSyncStatus = useCallback(
    async (sessionId: string) => {
      return execute(api.getChatwootSyncStatus(sessionId));
    },
    [execute]
  );

  const getChatwootOverview = useCallback(
    async (sessionId: string) => {
      return execute(api.getChatwootOverview(sessionId));
    },
    [execute]
  );

  const resolveAllChatwootConversations = useCallback(
    async (sessionId: string) => {
      return execute(api.resolveAllChatwootConversations(sessionId));
    },
    [execute]
  );

  const getChatwootConversationsStats = useCallback(
    async (sessionId: string) => {
      return execute(api.getChatwootConversationsStats(sessionId));
    },
    [execute]
  );

  const resetChatwoot = useCallback(
    async (sessionId: string) => {
      return execute(api.resetChatwoot(sessionId));
    },
    [execute]
  );

  return {
    chatwootConfig,
    loading,
    error,
    getChatwootConfig,
    setChatwootConfig,
    validateChatwootCredentials,
    syncChatwootContacts,
    syncChatwootMessages,
    syncChatwootAll,
    getChatwootSyncStatus,
    getChatwootOverview,
    resolveAllChatwootConversations,
    getChatwootConversationsStats,
    resetChatwoot,
  };
}

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