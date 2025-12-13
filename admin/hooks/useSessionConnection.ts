"use client";

import { useState, useCallback, useEffect } from "react";
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

  const fetchQR = useCallback(async () => {
    if (!sessionName) return;

    setQrStatus('loading');
    try {
      const response = await getQR(sessionName);
      if (response.qr) {
        setQrCode(response.qr);
      }
      setQrStatus(response.status as any);
    } catch (error) {
      console.error("Failed to fetch QR:", error);
      setQrStatus('idle');
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