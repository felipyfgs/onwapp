import { connect, NatsConnection, Subscription, StringCodec } from "nats.ws";

export interface SessionEvent {
  event: string;
  sessionId: string;
  session: string;
  status: string;
  timestamp: string;
  data?: {
    qrCode?: string;
    qrBase64?: string;
    pairingCode?: string;
    reason?: string;
    message?: string;
    [key: string]: unknown;
  };
}

export type EventCallback = (event: SessionEvent) => void;

function getNatsUrl(): string | null {
  if (typeof window === "undefined") return null;

  // Se configurado explicitamente, usa
  const envUrl = process.env.NEXT_PUBLIC_NATS_WS_URL;
  if (envUrl && envUrl !== "ws://localhost:9222") {
    return envUrl;
  }

  // Auto-detect: usa o mesmo host da página
  const host = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${host}:9222`;
}

class NatsClient {
  private connection: NatsConnection | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private sc = StringCodec();

  async connect(url: string): Promise<void> {
    try {
      this.connection = await connect({
        servers: url,
        reconnect: true,
        maxReconnectAttempts: this.maxReconnectAttempts,
        reconnectTimeWait: 2000,
      });

      this.reconnectAttempts = 0;
      console.log("[NATS] Connected to", url);

      (async () => {
        if (!this.connection) return;
        for await (const status of this.connection.status()) {
          console.log("[NATS] Status:", status.type, status.data);
        }
      })();
    } catch (error) {
      console.error("[NATS] Connection failed:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    for (const sub of this.subscriptions.values()) {
      sub.unsubscribe();
    }
    this.subscriptions.clear();

    if (this.connection) {
      await this.connection.drain();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection !== null && !this.connection.isClosed();
  }

  subscribe(subject: string, callback: EventCallback): () => void {
    if (!this.connection) {
      console.error("[NATS] Not connected");
      return () => {};
    }

    const sub = this.connection.subscribe(subject);
    this.subscriptions.set(subject, sub);

    (async () => {
      for await (const msg of sub) {
        try {
          const data = this.sc.decode(msg.data);
          const event: SessionEvent = JSON.parse(data);
          callback(event);
        } catch (error) {
          console.error("[NATS] Failed to parse message:", error);
        }
      }
    })();

    return () => {
      sub.unsubscribe();
      this.subscriptions.delete(subject);
    };
  }

  subscribeToSessionEvents(callback: EventCallback): () => void {
    return this.subscribe("ONWAPP.admin.>", callback);
  }
}

export const natsClient = new NatsClient();

export async function connectNats(url?: string): Promise<void> {
  const natsUrl = url || getNatsUrl();
  if (!natsUrl) {
    console.warn("[NATS] Cannot determine WebSocket URL (SSR)");
    return;
  }
  await natsClient.connect(natsUrl);
}

export async function disconnectNats(): Promise<void> {
  await natsClient.disconnect();
}
