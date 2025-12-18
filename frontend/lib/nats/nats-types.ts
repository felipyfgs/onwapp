// Tipos para integração NATS no frontend ONWApp

export interface NatsMessage {
  subject: string;
  data: any;
  timestamp: Date;
  raw?: Uint8Array;
}

export interface NatsConnectionState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  reconnectCount: number;
  lastError?: string;
}

export interface NatsSubscriptionOptions {
  queue?: string;
  maxMessages?: number;
  timeout?: number;
}

export type NatsMessageHandler = (message: NatsMessage) => void;