"use client";

import { useState, useCallback } from "react";
import { copyToClipboard } from "@/lib/utils";

interface UseApiKeysReturn {
  isVisible: boolean;
  isCopied: boolean;
  actions: {
    toggleVisibility: () => void;
    copyToClipboard: (key: string) => Promise<void>;
    resetCopyState: () => void;
  };
}

export function useApiKeys(): UseApiKeysReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const copyToClipboardAction = useCallback(async (key: string) => {
    if (!key) return;

    try {
      await copyToClipboard(key);
      setIsCopied(true);

      // Auto-reset copy state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy API key:", error);
      setIsCopied(false);
    }
  }, []);

  const resetCopyState = useCallback(() => {
    setIsCopied(false);
  }, []);

  return {
    isVisible,
    isCopied,
    actions: {
      toggleVisibility,
      copyToClipboard: copyToClipboardAction,
      resetCopyState,
    },
  };
}