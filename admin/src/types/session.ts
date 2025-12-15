export interface Session {
  id: string;
  session: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr' | 'error';
  apiKey: string;
  createdAt: string;
  updatedAt: string;
  device?: {
    platform: string;
    pushName: string;
    jid: string;
  };
  stats?: {
    messages: number;
    chats: number;
    contacts: number;
    groups: number;
  };
}

export interface SessionCreateData {
  session: string;
}

export interface QRResponse {
  qr?: string;
  code?: string;
  message?: string;
}

export type SessionStatus = Session['status'];
