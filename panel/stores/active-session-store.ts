import { create } from 'zustand';
import type { SessionEvent } from '@/lib/types/nats';

interface SessionStats {
  messages: number;
  chats: number;
  contacts: number;
  groups: number;
}

interface SessionInfo {
  status: 'connected' | 'disconnected' | 'connecting';
  pushName?: string;
  profilePicture?: string;
  phone?: string;
  stats?: SessionStats;
}

interface ActiveSessionState {
  sessionId: string | null;
  status: 'connected' | 'disconnected' | 'connecting';
  qrCode: string | null;
  pairingCode: string | null;
  lastEvent: SessionEvent | null;
  pushName: string | null;
  profilePicture: string | null;
  phone: string | null;
  stats: SessionStats | null;
  setSessionId: (sessionId: string | null) => void;
  setSessionInfo: (info: SessionInfo) => void;
  updateFromEvent: (event: SessionEvent) => void;
  reset: () => void;
}

export const useActiveSessionStore = create<ActiveSessionState>((set) => ({
  sessionId: null,
  status: 'disconnected',
  qrCode: null,
  pairingCode: null,
  lastEvent: null,
  pushName: null,
  profilePicture: null,
  phone: null,
  stats: null,

  setSessionId: (sessionId) => set({ sessionId }),

  setSessionInfo: (info) => set({
    status: info.status,
    pushName: info.pushName || null,
    profilePicture: info.profilePicture || null,
    phone: info.phone || null,
    stats: info.stats || null,
  }),

  updateFromEvent: (event) =>
    set((state) => {
      const updates: Partial<ActiveSessionState> = {
        lastEvent: event,
        status: event.status,
      };

      if (event.event === 'session.qr' && event.data) {
        const qrData = event.data as { 
          qrBase64?: string; 
          qrCode?: string; 
          pairingCode?: string;
        };
        updates.qrCode = qrData.qrBase64 || qrData.qrCode || null;
        updates.pairingCode = qrData.pairingCode || null;
      }

      if (event.event === 'session.connected') {
        updates.qrCode = null;
        updates.pairingCode = null;
      }

      return { ...state, ...updates };
    }),

  reset: () =>
    set({
      sessionId: null,
      status: 'disconnected',
      qrCode: null,
      pairingCode: null,
      lastEvent: null,
      pushName: null,
      profilePicture: null,
      phone: null,
      stats: null,
    }),
}));
