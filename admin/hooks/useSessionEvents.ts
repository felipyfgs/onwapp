"use client";

import { useEffect, useCallback, useRef } from "react";
import { natsClient, connectNats, SessionEvent } from "@/lib/nats";

export function useSessionEvents(onEvent: (event: SessionEvent) => void) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    async function setup() {
      const natsUrl = process.env.NEXT_PUBLIC_NATS_WS_URL;
      if (!natsUrl) {
        console.debug("[useSessionEvents] NATS WebSocket URL not configured, skipping real-time events");
        return;
      }

      try {
        if (!natsClient.isConnected()) {
          await connectNats();
        }

        if (!mounted) return;

        unsubscribe = natsClient.subscribeToSessionEvents((event) => {
          if (mounted) {
            callbackRef.current(event);
          }
        });
      } catch (error) {
        console.warn("[useSessionEvents] NATS connection failed, real-time events disabled");
      }
    }

    setup();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
}

export function useSessionEvent(
  sessionName: string | null,
  onEvent: (event: SessionEvent) => void
) {
  const handleEvent = useCallback(
    (event: SessionEvent) => {
      if (sessionName && event.session === sessionName) {
        onEvent(event);
      }
    },
    [sessionName, onEvent]
  );

  useSessionEvents(handleEvent);
}
