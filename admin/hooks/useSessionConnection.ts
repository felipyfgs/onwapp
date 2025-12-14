"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getQR, pairPhone, connectSession } from "@/lib/api";
import { useSessionEvent } from "@/hooks/useSessionEvents";
import { SessionEvent } from "@/lib/nats";
import { cleanPhoneNumber } from "@/lib/utils";

interface UseSessionConnectionReturn {
  qrCode: string | null;
  qrStatus: 'idle' | 'loading' | 'connecting' | 'connected';
  phoneCode: string | null;
  phoneStatus: 'idle' | 'loading' | 'code_generated' | 'connecting' | 'connected' | 'error';
  errorMessage: string;
  actions: {
    fetchQR: () => Promise<void>;
    generatePhoneCode: (phone: string) => Promise<string>;
    reset: () => void;
  };
}

export function useSessionConnection(sessionName: string): UseSessionConnectionReturn {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'connecting' | 'connected'>('idle');
  const [phoneCode, setPhoneCode] = useState<string | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'loading' | 'code_generated' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Refs for debouncing and state tracking
  const lastRequestTime = useRef<number>(0);
  const requestInProgress = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = useRef<number>(0);

  const fetchQR = useCallback(async (retryCount: number = 0) => {
    if (!sessionName || requestInProgress.current) {
      console.log(`[QR Fetch] Skipped - sessionName: ${!!sessionName}, requestInProgress: ${requestInProgress.current}`);
      return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;

    // 2 second debounce between QR requests
    if (timeSinceLastRequest < 2000 && retryCount === 0) {
      console.log(`[QR Fetch] Throttled - Last request was ${timeSinceLastRequest}ms ago (minimum 2000ms required)`);
      return;
    }

    console.log(`[QR Fetch] Starting request for session: ${sessionName} (attempt ${retryCount + 1})`);
    requestInProgress.current = true;
    lastRequestTime.current = now;

    setQrStatus('loading');
    try {
      const response = await getQR(sessionName);
      if (response.qr) {
        setQrCode(response.qr);
        setQrStatus(response.status as any);
        console.log(`[QR Fetch] QR code received for session: ${sessionName}`);
        maxRetries.current = 0; // Reset retry counter on success
      } else if (response.status === 'connecting' && retryCount < 10) {
        // QR not available yet but session is connecting - retry
        setQrStatus('connecting');
        console.log(`[QR Fetch] QR not available yet, will retry in 2s (attempt ${retryCount + 1}/10)`);
        maxRetries.current = retryCount + 1;

        // Clear any existing retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          requestInProgress.current = false;
          fetchQR(retryCount + 1);
        }, 2000);
      } else {
        setQrStatus(response.status as any);
        maxRetries.current = 0;
      }
    } catch (error) {
      console.error("[QR Fetch] Failed to fetch QR:", error);
      setQrStatus('idle');
      maxRetries.current = 0;
    } finally {
      if (!retryTimeoutRef.current) {
        // Clear request in progress after a short delay to prevent rapid retries
        setTimeout(() => {
          requestInProgress.current = false;
        }, 1000);
      }
    }
  }, [sessionName]);

  const generatePhoneCode = useCallback(async (phone: string): Promise<string> => {
    if (!sessionName || !phone) throw new Error("Session name and phone are required");

    setPhoneStatus('loading');
    setErrorMessage('');

    try {
      // Ensure session is connected
      await connectSession(sessionName);

      // Small delay to ensure connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      const cleanPhone = cleanPhoneNumber(phone);
      const response = await pairPhone(sessionName, cleanPhone);
      setPhoneCode(response.code);
      setPhoneStatus('code_generated');
      return response.code;
    } catch (error: any) {
      console.error("Failed to generate pair code:", error);
      const errorMessage = error?.message || "Failed to generate code";

      // User-friendly error messages
      if (errorMessage.includes("websocket not connected")) {
        setErrorMessage("Failed to initialize WhatsApp connection. Please try again.");
      } else if (errorMessage.includes("session not found")) {
        setErrorMessage("Session not found. Please check session name and try again.");
      } else {
        setErrorMessage("Failed to generate code. Please try again.");
      }

      setPhoneStatus('error');
      throw error;
    }
  }, [sessionName]);

  const reset = useCallback(() => {
    setQrCode(null);
    setQrStatus('idle');
    setPhoneCode(null);
    setPhoneStatus('idle');
    setErrorMessage('');
    // Reset debouncing refs
    requestInProgress.current = false;
    lastRequestTime.current = 0;
    maxRetries.current = 0;
    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    console.log("[QR Fetch] Reset completed - debouncing refs cleared");
  }, []);

  // Handle WebSocket events
  const handleEvent = useCallback((event: SessionEvent) => {
    if (event.event === "session.qr" && event.data?.qrBase64) {
      setQrCode(event.data.qrBase64);
      setQrStatus('connecting');
    } else if (event.event === "session.connected") {
      setQrStatus('connected');
      setPhoneStatus('connected');
    } else if (event.event === "session.disconnected") {
      setQrStatus('idle');
      setPhoneStatus('idle');
    }
  }, []);

  useSessionEvent(sessionName, handleEvent);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    qrCode,
    qrStatus,
    phoneCode,
    phoneStatus,
    errorMessage,
    actions: {
      fetchQR,
      generatePhoneCode,
      reset,
    },
  };
}