import { WASocket } from 'whaileys';

export interface SessionData {
  qrCode?: string;
  isNewLogin: boolean;
  logoutAttempts: number;
}

export interface QRCodeRef {
  value?: string;
}

export const RECONNECT_DELAYS = {
  DEFAULT: 3000,
  RESTART_REQUIRED: 10000,
} as const;

export const MAX_LOGOUT_ATTEMPTS = 2;

export interface HandlerContext {
  sessionId: string;
  socket: WASocket;
  logger: {
    log: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, error?: unknown) => void;
    warn: (message: string) => void;
    debug: (message: string, meta?: Record<string, unknown>) => void;
  };
}

export interface WAMessageKey {
  id: string;
  remoteJid: string;
  fromMe?: boolean;
  participant?: string;
}

export interface WAMessageContent {
  conversation?: string;
  extendedTextMessage?: { text: string };
  imageMessage?: { caption?: string; mimetype?: string };
  videoMessage?: { caption?: string; mimetype?: string };
  audioMessage?: { ptt?: boolean; mimetype?: string };
  documentMessage?: { fileName?: string; mimetype?: string };
  stickerMessage?: { mimetype?: string };
  contactMessage?: Record<string, unknown>;
  locationMessage?: Record<string, unknown>;
  liveLocationMessage?: Record<string, unknown>;
  listMessage?: Record<string, unknown>;
  listResponseMessage?: Record<string, unknown>;
  buttonsResponseMessage?: Record<string, unknown>;
  templateButtonReplyMessage?: Record<string, unknown>;
  reactionMessage?: { text?: string };
}

export interface WAMessage {
  key: WAMessageKey;
  message?: WAMessageContent;
  pushName?: string;
  messageTimestamp?: number | Long;
}

export interface Long {
  low: number;
  high: number;
  unsigned: boolean;
}
