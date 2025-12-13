"use client";

import { useCallback } from "react";
import {
  formatApiKey as utilsFormatApiKey,
  cleanPhoneNumber,
  validateSessionName,
  validatePhoneNumber,
} from "@/lib/utils";

interface UseSessionFormReturn {
  validation: {
    validateSessionName: (name: string) => string | null;
    validatePhoneNumber: (phone: string) => string | null;
  };
  formatting: {
    formatApiKey: (key: string, show?: boolean) => string;
    cleanPhoneNumber: (phone: string) => string;
  };
}

export function useSessionForm(): UseSessionFormReturn {
  const validateSessionNameAction = useCallback((name: string): string | null => {
    const result = validateSessionName(name);
    return result.isValid ? null : result.error;
  }, []);

  const validatePhoneNumberAction = useCallback((phone: string): string | null => {
    const result = validatePhoneNumber(phone);
    return result.isValid ? null : result.error;
  }, []);

  const formatApiKeyAction = useCallback((key: string, show: boolean = false): string => {
    if (show) {
      return key;
    }
    return utilsFormatApiKey(key);
  }, []);

  const cleanPhoneNumberAction = useCallback((phone: string): string => {
    return cleanPhoneNumber(phone);
  }, []);

  return {
    validation: {
      validateSessionName: validateSessionNameAction,
      validatePhoneNumber: validatePhoneNumberAction,
    },
    formatting: {
      formatApiKey: formatApiKeyAction,
      cleanPhoneNumber: cleanPhoneNumberAction,
    },
  };
}