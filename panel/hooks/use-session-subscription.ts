'use client';

import { useEffect, useState } from 'react';
import { natsClient } from '@/lib/nats';
import { useActiveSessionStore } from '@/stores/active-session-store';
import apiClient from '@/lib/api';

export function useSessionSubscription(sessionId: string) {
  const { setSessionId, setSessionInfo, updateFromEvent, reset } = useActiveSessionStore();
  const [sessionExists, setSessionExists] = useState(true);

  useEffect(() => {
    setSessionId(sessionId);
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const response = await apiClient.get(`/sessions/${sessionId}/status`);
        if (response.data) {
          setSessionInfo({
            status: response.data.status || 'disconnected',
            pushName: response.data.pushName,
            profilePicture: response.data.profilePicture,
            phone: response.data.phone,
            stats: response.data.stats,
          });
          setSessionExists(true);
        }
      } catch (error) {
        console.error('Failed to fetch session info:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            setSessionExists(false);
          }
        }
      }

      try {
        unsubscribe = await natsClient.subscribeToSession(sessionId, (event) => {
          console.log(`📩 Session ${sessionId} Event:`, event);
          updateFromEvent(event);
        });
      } catch (error) {
        console.error('Failed to subscribe to session:', error);
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      reset();
    };
  }, [sessionId, setSessionId, setSessionInfo, updateFromEvent, reset]);

  return sessionExists;
}
