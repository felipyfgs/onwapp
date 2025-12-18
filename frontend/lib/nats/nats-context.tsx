// Contexto React para gerenciamento de conexão NATS no ONWApp
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NatsClient } from './nats-client';
import { NatsConnectionState, NatsMessage, NatsSubscriptionOptions } from './nats-types';

interface NatsContextType {
  client: NatsClient;
  state: NatsConnectionState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (subject: string, callback: (msg: NatsMessage) => void, options?: NatsSubscriptionOptions) => Promise<void>;
  publish: (subject: string, data: any) => Promise<void>;
  request: (subject: string, data: any, timeout?: number) => Promise<any>;
}

const NatsContext = createContext<NatsContextType | undefined>(undefined);

export function NatsProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new NatsClient());
  const [state, setState] = useState<NatsConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectCount: 0,
  });

  const connect = async () => {
    setState(prev => ({ ...prev, connecting: true, error: null }));
    try {
      await client.connect();
      setState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        reconnectCount: 0,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error as Error,
        reconnectCount: prev.reconnectCount + 1,
        lastError: error instanceof Error ? error.message : String(error),
      }));
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await client.disconnect();
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        lastError: error instanceof Error ? error.message : String(error),
      }));
      throw error;
    }
  };

  const subscribe = async (subject: string, callback: (msg: NatsMessage) => void, options?: NatsSubscriptionOptions) => {
    if (!state.connected) {
      throw new Error('NATS client not connected');
    }
    return client.subscribe(subject, callback, options);
  };

  const publish = async (subject: string, data: any) => {
    if (!state.connected) {
      throw new Error('NATS client not connected');
    }
    return client.publish(subject, data);
  };

  const request = async (subject: string, data: any, timeout?: number) => {
    if (!state.connected) {
      throw new Error('NATS client not connected');
    }
    return client.request(subject, data, timeout);
  };

  // Auto-connect on mount
  useEffect(() => {
    connect().catch(console.error);
    
    return () => {
      disconnect().catch(console.error);
    };
  }, []);

  return (
    <NatsContext.Provider value={{ client, state, connect, disconnect, subscribe, publish, request }}>
      {children}
    </NatsContext.Provider>
  );
}

export function useNats() {
  const context = useContext(NatsContext);
  if (!context) {
    throw new Error('useNats must be used within a NatsProvider');
  }
  return context;
}