// Hooks personalizados para integração NATS no ONWApp
'use client';

import { useEffect } from 'react';
import { useNats } from './nats-context';
import { NatsMessage, NatsSubscriptionOptions } from './nats-types';

export function useNatsSubscription(
  subject: string,
  callback: (msg: NatsMessage) => void,
  options?: NatsSubscriptionOptions
) {
  const { subscribe, state } = useNats();

  useEffect(() => {
    if (state.connected) {
      const subscriptionPromise = subscribe(subject, callback, options);
      
      return () => {
        // Cleanup subscription if needed
        // Note: Current implementation doesn't have unsubscribe method
        // This would be enhanced in a production environment
      };
    }
  }, [subject, callback, state.connected, subscribe, options]);
}

export function useNatsAutoReconnect(url: string, retryInterval: number = 5000) {
  const { connect, state } = useNats();

  useEffect(() => {
    if (!state.connected && !state.connecting) {
      const timer = setTimeout(() => {
        connect().catch(console.error);
      }, retryInterval);

      return () => clearTimeout(timer);
    }
  }, [state.connected, state.connecting, connect, url, retryInterval]);
}

export function useNatsStatus() {
  const { state } = useNats();
  return state;
}

export function useNatsPublisher(subject: string) {
  const { publish, state } = useNats();

  const publishMessage = async (data: any) => {
    if (!state.connected) {
      throw new Error('NATS not connected');
    }
    return publish(subject, data);
  };

  return { publish: publishMessage, isConnected: state.connected };
}