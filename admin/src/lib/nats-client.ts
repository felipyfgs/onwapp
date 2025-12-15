"use client";

import { connect, type NatsConnection, StringCodec } from "nats.ws";
import { NATS_WS_URL } from "@/lib/constants";

let natsConnection: NatsConnection | null = null;
let isConnecting = false;

interface NatsEvent {
  event: string;
  sessionId: string;
  session: string;
  status: string;
  timestamp: string;
  data?: any;
}

export async function connectNats(): Promise<NatsConnection> {
  if (natsConnection) {
    return natsConnection;
  }

  if (isConnecting) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (natsConnection) {
          clearInterval(interval);
          resolve(natsConnection);
        }
      }, 100);
    });
  }

  isConnecting = true;

  try {
    natsConnection = await connect({
      servers: NATS_WS_URL,
      reconnect: true,
    });

    isConnecting = false;
    return natsConnection;
  } catch (error) {
    isConnecting = false;
    throw error;
  }
}

export async function subscribeToEvents(
  callback: (event: NatsEvent) => void
): Promise<() => void> {
  const nc = await connectNats();
  const sc = StringCodec();

  const sub = nc.subscribe("admin.>", {
    callback: (err, msg) => {
      if (err) {
        console.error("NATS subscription error:", err);
        return;
      }

      try {
        const event = JSON.parse(sc.decode(msg.data)) as NatsEvent;
        callback(event);
      } catch (e) {
        console.error("Error parsing NATS event:", e);
      }
    },
  });

  return () => {
    sub.unsubscribe();
  };
}

export async function disconnectNats(): Promise<void> {
  if (natsConnection) {
    await natsConnection.close();
    natsConnection = null;
  }
}