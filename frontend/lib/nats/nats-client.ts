// Cliente NATS para o frontend ONWApp
// Usa WebSocket para comunicação em tempo real

import { connect, NatsConnection, StringCodec, Empty } from 'nats.ws';
import { NatsSubscriptionOptions } from './nats-types';

interface NatsClientOptions {
  url?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export class NatsClient {
  private connection: NatsConnection | null = null;
  private codec = StringCodec();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private options: NatsClientOptions;
  private subscriptions: Map<string, { callback: (msg: any) => void; subscription: any }> = new Map();

  constructor(options: NatsClientOptions = {}) {
    this.options = {
      url: options.url || process.env.NEXT_PUBLIC_NATS_URL || 'ws://localhost:8080',
      reconnectDelay: options.reconnectDelay || 1000,
      maxReconnectAttempts: options.maxReconnectAttempts || 5,
    };
  }

  async connect(): Promise<void> {
    try {
      this.connection = await connect({
        servers: this.options.url,
        reconnect: true,
        maxReconnectAttempts: this.options.maxReconnectAttempts,
      });
      
      console.log('Connected to NATS server:', this.options.url);
      this.reconnectAttempts = 0;
      
      // Reset reconnect timeout if any
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Re-subscribe to all previous subscriptions
      this.resubscribeAll();
      
    } catch (error) {
      console.error('Connection failed:', error);
      this.scheduleReconnect();
      throw error;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.calculateReconnectDelay();
    console.log(`Attempting to reconnect in ${delay}ms... (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(console.error);
    }, delay);
  }

  private calculateReconnectDelay(): number {
    const baseDelay = this.options.reconnectDelay || 1000;
    const maxDelay = 30000; // 30 seconds max
    return Math.min(baseDelay * Math.pow(2, this.reconnectAttempts), maxDelay);
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        console.log('Disconnected from NATS server');
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }

    // Clear all subscriptions
    this.subscriptions.clear();
  }

  async subscribe(subject: string, callback: (msg: any) => void, options: NatsSubscriptionOptions = {}): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to NATS server');
    }

    try {
      const subscription = this.connection.subscribe(subject, options);
      
      // Store subscription for reconnection
      this.subscriptions.set(subject, { callback, subscription });

      (async () => {
        for await (const m of subscription) {
          try {
            const data = this.codec.decode(m.data);
            const message = {
              subject: m.subject,
              data: JSON.parse(data),
              timestamp: new Date(),
              raw: m.data
            };
            callback(message);
          } catch (parseError) {
            console.error('Error parsing message:', parseError);
          }
        }
      })();

    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  async publish(subject: string, data: any): Promise<void> {
    if (!this.connection) {
      throw new Error('Not connected to NATS server');
    }

    try {
      const encoded = this.codec.encode(JSON.stringify(data));
      await this.connection.publish(subject, encoded);
    } catch (error) {
      console.error('Publish error:', error);
      throw error;
    }
  }

  async request(subject: string, data: any, timeout: number = 1000): Promise<any> {
    if (!this.connection) {
      throw new Error('Not connected to NATS server');
    }

    try {
      const encoded = this.codec.encode(JSON.stringify(data));
      const response = await this.connection.request(subject, encoded, { timeout });
      const decoded = this.codec.decode(response.data);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  private resubscribeAll(): void {
    if (!this.connection) return;

    this.subscriptions.forEach(({ callback, subscription }, subject) => {
      try {
        // The subscription object might need to be recreated
        // For now, we'll just store the callback and subject
        // A more robust implementation would recreate the subscription
        console.log(`Re-subscribing to ${subject}`);
        this.subscribe(subject, callback).catch(console.error);
      } catch (error) {
        console.error(`Failed to re-subscribe to ${subject}:`, error);
      }
    });
  }

  getConnectionState(): { connected: boolean; url: string } {
    return {
      connected: !!this.connection,
      url: this.options.url || 'unknown'
    };
  }
}