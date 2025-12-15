"use client";

import { useEffect, useState } from "react";
import { connectNats, subscribeToEvents, disconnectNats } from "@/lib/nats-client";
import { NATS_EVENT_TYPES } from "@/lib/constants";

type EventType = keyof typeof NATS_EVENT_TYPES;

interface NatsEvent {
  event: string;
  sessionId: string;
  session: string;
  status: string;
  timestamp: string;
  data?: any;
}

interface UseNatsResult {
  events: NatsEvent[];
  isConnected: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useNats(): UseNatsResult {
  const [events, setEvents] = useState<NatsEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const connect = async () => {
    try {
      await connectNats();
      setIsConnected(true);
      setError(null);

      const unsubscribeFn = await subscribeToEvents((event) => {
        setEvents((prev) => [...prev, event]);
      });
      setUnsubscribe(() => unsubscribeFn);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to connect to NATS"));
      setIsConnected(false);
    }
  };

  const disconnect = async () => {
    try {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
      await disconnectNats();
      setIsConnected(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to disconnect from NATS"));
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    events,
    isConnected,
    error,
    connect,
    disconnect,
  };
}

export function useNatsEvent<T = any>(
  eventType: EventType,
  callback: (event: NatsEvent) => void
): void {
  const { events } = useNats();

  useEffect(() => {
    const handler = (event: NatsEvent) => {
      if (event.event === NATS_EVENT_TYPES[eventType]) {
        callback(event);
      }
    };

    const newEvents = events.filter(
      (event) => event.event === NATS_EVENT_TYPES[eventType]
    );
    newEvents.forEach(handler);
  }, [events, eventType, callback]);
}