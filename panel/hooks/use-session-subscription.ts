'use client';

import { useEffect } from 'react';
import { natsClient } from '@/lib/nats';
import { useActiveSessionStore } from '@/stores/active-session-store';

export function useSessionSubscription(sessionId: string) {
  const { setSessionId, updateFromEvent, reset } = useActiveSessionStore();

  useEffect(() => {
    setSessionId(sessionId);
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
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
  }, [sessionId, setSessionId, updateFromEvent, reset]);
}
