'use client';

import { useEffect } from 'react';
import { natsClient } from '@/lib/nats';
import { useGlobalStore } from '@/stores/global-store';
import { useSessionStore } from '@/stores/session-store';

export function NatsProvider({ children }: { children: React.ReactNode }) {
  const setNatsConnected = useGlobalStore((state) => state.setNatsConnected);
  const addSessionEvent = useGlobalStore((state) => state.addSessionEvent);
  const updateSession = useSessionStore((state) => state.updateSession);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        await natsClient.connect();
        setNatsConnected(true);

        unsubscribe = await natsClient.subscribeToAdmin((event) => {
          console.log('📩 NATS Event:', event);
          
          addSessionEvent(event);

          if (event.status) {
            updateSession(event.sessionId, { status: event.status });
          }

          if (event.event === 'session.qr' && event.data) {
            const qrData = event.data as any;
            updateSession(event.sessionId, {
              qr: qrData.qrBase64 || qrData.qrCode,
            });
          }
        });
      } catch (error) {
        console.error('Failed to initialize NATS:', error);
        setNatsConnected(false);
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      natsClient.disconnect();
    };
  }, [setNatsConnected, addSessionEvent, updateSession]);

  return <>{children}</>;
}
