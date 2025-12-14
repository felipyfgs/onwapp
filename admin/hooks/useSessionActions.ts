"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  connectSession,
  disconnectSession,
  logoutSession,
  restartSession,
  deleteSession,
} from "@/lib/api";

interface UseSessionActionsReturn {
  actions: {
    connect: (name: string) => Promise<void>;
    disconnect: (name: string) => Promise<void>;
    logout: (name: string) => Promise<void>;
    restart: (name: string) => Promise<void>;
    delete: (name: string) => Promise<void>;
  };
}

export function useSessionActions(): UseSessionActionsReturn {
  const connect = useCallback(async (name: string) => {
    if (!name?.trim()) {
      toast.error("Session name is required");
      return;
    }

    try {
      const result = await connectSession(name.trim());
      toast.success(result.message || "Session connection initiated");
    } catch (error: any) {
      console.error("Failed to connect session:", error);
      const errorMessage = error?.message || "Failed to connect session";
      toast.error(errorMessage);
    }
  }, []);

  const disconnect = useCallback(async (name: string) => {
    if (!name?.trim()) {
      toast.error("Session name is required");
      return;
    }

    try {
      await disconnectSession(name.trim());
      toast.success("Session disconnected successfully");
    } catch (error: any) {
      console.error("Failed to disconnect session:", error);
      const errorMessage = error?.message || "Failed to disconnect session";
      toast.error(errorMessage);
    }
  }, []);

  const logout = useCallback(async (name: string) => {
    if (!name?.trim()) {
      toast.error("Session name is required");
      return;
    }

    try {
      await logoutSession(name.trim());
      toast.success("Session logged out successfully");
    } catch (error: any) {
      console.error("Failed to logout session:", error);
      const errorMessage = error?.message || "Failed to logout session";
      toast.error(errorMessage);
    }
  }, []);

  const restart = useCallback(async (name: string) => {
    if (!name?.trim()) {
      toast.error("Session name is required");
      return;
    }

    try {
      await restartSession(name.trim());
      toast.success("Session restart initiated");
    } catch (error: any) {
      console.error("Failed to restart session:", error);
      const errorMessage = error?.message || "Failed to restart session";
      toast.error(errorMessage);
    }
  }, []);

  const deleteSessionAction = useCallback(async (name: string) => {
    if (!name?.trim()) {
      toast.error("Session name is required");
      return;
    }

    // Confirmation dialog
    const isConfirmed = window.confirm(`Are you sure you want to delete session "${name.trim()}"? This action cannot be undone.`);
    if (!isConfirmed) {
      return;
    }

    try {
      await deleteSession(name.trim());
      toast.success(`Session "${name.trim()}" deleted successfully`);
    } catch (error: any) {
      console.error("Failed to delete session:", error);
      const errorMessage = error?.message || "Failed to delete session";
      toast.error(errorMessage);
    }
  }, []);

  return {
    actions: {
      connect,
      disconnect,
      logout,
      restart,
      delete: deleteSessionAction,
    },
  };
}