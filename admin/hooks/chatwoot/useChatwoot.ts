"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getChatwootConfig,
  setChatwootConfig,
  deleteChatwootConfig,
  syncChatwoot,
  getChatwootSyncStatus,
  getChatwootOverview,
  getChatwootConversationStats,
  resolveAllChatwootConversations,
  resetChatwoot,
  validateChatwootCredentials,
  ChatwootConfig,
  ChatwootSyncStatus,
  ChatwootOverview,
  ChatwootStats,
} from "@/lib/api";
import { toast } from "sonner";

interface ChatwootFormState {
  baseUrl: string;
  apiToken: string;
  accountId: string;
  inboxId: string;
}

interface UseChatwootReturn {
  // Data
  config: ChatwootConfig | null;
  syncStatus: ChatwootSyncStatus | null;
  overview: ChatwootOverview | null;
  stats: ChatwootStats | null;
  loading: boolean;

  // Form state
  form: ChatwootFormState;
  setFormField: (field: keyof ChatwootFormState, value: string) => void;

  // Dialog state
  configDialogOpen: boolean;
  setConfigDialogOpen: (open: boolean) => void;

  // Loading states
  validating: boolean;
  saving: boolean;

  // Actions
  refresh: () => Promise<void>;
  validateCredentials: () => Promise<boolean>;
  saveConfig: () => Promise<boolean>;
  sync: () => Promise<void>;
  resolveAll: () => Promise<void>;
  reset: () => Promise<void>;
  deleteConfig: () => Promise<void>;
}

export function useChatwoot(sessionId: string): UseChatwootReturn {
  // Data state
  const [config, setConfig] = useState<ChatwootConfig | null>(null);
  const [syncStatus, setSyncStatus] = useState<ChatwootSyncStatus | null>(null);
  const [overview, setOverview] = useState<ChatwootOverview | null>(null);
  const [stats, setStats] = useState<ChatwootStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState<ChatwootFormState>({
    baseUrl: "",
    apiToken: "",
    accountId: "",
    inboxId: "",
  });

  // Dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Loading states
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  const setFormField = useCallback((field: keyof ChatwootFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [configData, statusData, overviewData, statsData] = await Promise.all([
        getChatwootConfig(sessionId),
        getChatwootSyncStatus(sessionId).catch(() => null),
        getChatwootOverview(sessionId).catch(() => null),
        getChatwootConversationStats(sessionId).catch(() => null),
      ]);
      setConfig(configData);
      setSyncStatus(statusData);
      setOverview(overviewData);
      setStats(statsData);
      if (configData) {
        setForm({
          baseUrl: configData.baseUrl,
          apiToken: configData.apiAccessToken,
          accountId: String(configData.accountId),
          inboxId: String(configData.inboxId),
        });
      }
    } catch (error) {
      console.error("Failed to fetch Chatwoot data:", error);
      toast.error("Failed to load Chatwoot data");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const validateCredentials = useCallback(async (): Promise<boolean> => {
    if (!form.baseUrl || !form.apiToken) {
      toast.error("URL and API token are required");
      return false;
    }
    setValidating(true);
    try {
      const result = await validateChatwootCredentials(form.baseUrl, form.apiToken);
      if (result.valid && result.account) {
        setFormField("accountId", String(result.account.id));
        toast.success(`Credentials valid! Account: ${result.account.name}`);
        return true;
      } else {
        toast.error("Invalid credentials");
        return false;
      }
    } catch {
      toast.error("Failed to validate credentials");
      return false;
    } finally {
      setValidating(false);
    }
  }, [form.baseUrl, form.apiToken, setFormField]);

  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!sessionId || !form.baseUrl || !form.apiToken || !form.accountId || !form.inboxId) {
      toast.error("All fields are required");
      return false;
    }
    setSaving(true);
    try {
      await setChatwootConfig(sessionId, {
        baseUrl: form.baseUrl,
        apiAccessToken: form.apiToken,
        accountId: parseInt(form.accountId),
        inboxId: parseInt(form.inboxId),
      });
      setConfigDialogOpen(false);
      toast.success("Configuration saved");
      await refresh();
      return true;
    } catch {
      toast.error("Failed to save configuration");
      return false;
    } finally {
      setSaving(false);
    }
  }, [sessionId, form, refresh]);

  const sync = useCallback(async () => {
    if (!sessionId) return;
    try {
      await syncChatwoot(sessionId);
      toast.success("Sync started");
      await refresh();
    } catch {
      toast.error("Failed to start sync");
    }
  }, [sessionId, refresh]);

  const resolveAll = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await resolveAllChatwootConversations(sessionId);
      toast.success(`Resolved ${result.resolved} conversations`);
      await refresh();
    } catch {
      toast.error("Failed to resolve conversations");
    }
  }, [sessionId, refresh]);

  const reset = useCallback(async () => {
    if (!sessionId) return;
    try {
      await resetChatwoot(sessionId);
      toast.success("Integration reset");
      await refresh();
    } catch {
      toast.error("Failed to reset integration");
    }
  }, [sessionId, refresh]);

  const deleteConfig = useCallback(async () => {
    if (!sessionId) return;
    try {
      await deleteChatwootConfig(sessionId);
      setConfig(null);
      setSyncStatus(null);
      setOverview(null);
      setStats(null);
      setForm({ baseUrl: "", apiToken: "", accountId: "", inboxId: "" });
      toast.success("Configuration deleted");
    } catch {
      toast.error("Failed to delete configuration");
    }
  }, [sessionId]);

  return {
    // Data
    config,
    syncStatus,
    overview,
    stats,
    loading,

    // Form state
    form,
    setFormField,

    // Dialog state
    configDialogOpen,
    setConfigDialogOpen,

    // Loading states
    validating,
    saving,

    // Actions
    refresh,
    validateCredentials,
    saveConfig,
    sync,
    resolveAll,
    reset,
    deleteConfig,
  };
}
