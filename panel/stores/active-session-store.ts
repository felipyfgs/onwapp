import { create } from 'zustand';
import type { SessionEvent } from '@/lib/types/nats';

interface ActiveSessionState {
  sessionId: string | null;
  status: 'connected' | 'disconnected' | 'connecting';
  qrCode: string | null;
  pairingCode: string | null;
  lastEvent: SessionEvent | null;
  setSessionId: (sessionId: string | null) => void;
  updateFromEvent: (event: SessionEvent) => void;
  reset: () => void;
}

export const useActiveSessionStore = create<ActiveSessionState>((set) => ({
  sessionId: null,
  status: 'disconnected',
  qrCode: null,
  pairingCode: null,
  lastEvent: null,

  setSessionId: (sessionId) => set({ sessionId }),

  updateFromEvent: (event) =>
    set((state) => {
      const updates: Partial<ActiveSessionState> = {
        lastEvent: event,
        status: event.status,
      };

      if (event.event === 'session.qr' && event.data) {
        const qrData = event.data as any;
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
    }),
}));
