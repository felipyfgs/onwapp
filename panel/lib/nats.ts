import { connect, NatsConnection, StringCodec, Subscription } from 'nats.ws';
import type { SessionEvent, NatsEventCallback } from './types/nats';

const NATS_WS_URL = process.env.NEXT_PUBLIC_NATS_WS_URL || 'ws://localhost:9222';
const STREAM_PREFIX = 'ONWAPP';

class NatsClient {
  private nc: NatsConnection | null = null;
  private sc = StringCodec();
  private subscriptions = new Map<string, Subscription>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.nc || this.isConnecting) return;

    this.isConnecting = true;
    try {
      this.nc = await connect({ 
        servers: [NATS_WS_URL],
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
      });
      console.log('✅ Connected to NATS WebSocket');
      this.isConnecting = false;

      (async () => {
        if (!this.nc) return;
        for await (const status of this.nc.status()) {
          console.log('NATS Status:', status.type, status.data);
          if (status.type === 'disconnect' || status.type === 'error') {
            this.handleReconnect();
          }
        }
      })();
    } catch (err) {
      console.error('❌ Failed to connect to NATS:', err);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  async subscribeToAdmin(callback: NatsEventCallback): Promise<() => void> {
    if (!this.nc) {
      console.warn('⚠️  NATS not connected, attempting to connect...');
      await this.connect();
    }
    if (!this.nc) throw new Error('NATS connection failed');

    const topic = `${STREAM_PREFIX}.admin.>`;
    const sub = this.nc.subscribe(topic);
    this.subscriptions.set('admin', sub);

    (async () => {
      for await (const msg of sub) {
        try {
          const event: SessionEvent = JSON.parse(this.sc.decode(msg.data));
          callback(event);
        } catch (err) {
          console.error('Failed to parse NATS message:', err);
        }
      }
    })();

    console.log(`📡 Subscribed to ${topic}`);

    return () => this.unsubscribe('admin');
  }

  async subscribeToSession(sessionId: string, callback: NatsEventCallback): Promise<() => void> {
    if (!this.nc) {
      await this.connect();
    }
    if (!this.nc) throw new Error('NATS connection failed');

    const topic = `${STREAM_PREFIX}.admin.>`;
    const key = `session-${sessionId}`;
    const sub = this.nc.subscribe(topic);
    this.subscriptions.set(key, sub);

    (async () => {
      for await (const msg of sub) {
        try {
          const event: SessionEvent = JSON.parse(this.sc.decode(msg.data));
          if (event.sessionId === sessionId || event.session === sessionId) {
            callback(event);
          }
        } catch (err) {
          console.error('Failed to parse NATS message:', err);
        }
      }
    })();

    console.log(`📡 Subscribed to session ${sessionId}`);

    return () => this.unsubscribe(key);
  }

  unsubscribe(key: string): void {
    const sub = this.subscriptions.get(key);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(key);
      console.log(`🔌 Unsubscribed from ${key}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();

    if (this.nc) {
      await this.nc.drain();
      await this.nc.close();
      this.nc = null;
      console.log('🔌 Disconnected from NATS');
    }
  }

  isConnected(): boolean {
    return this.nc !== null;
  }
}

export const natsClient = new NatsClient();
export default natsClient;
