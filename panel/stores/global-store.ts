import { create } from 'zustand';
import type { SessionEvent } from '@/lib/types/nats';

interface GlobalState {
  natsConnected: boolean;
  sessions: Map<string, SessionEvent>;
  setNatsConnected: (connected: boolean) => void;
  addSessionEvent: (event: SessionEvent) => void;
  removeSession: (sessionId: string) => void;
  getSession: (sessionId: string) => SessionEvent | undefined;
  clearSessions: () => void;
}

export const useGlobalStore = create<GlobalState>((set, get) => ({
  natsConnected: false,
  sessions: new Map(),

  setNatsConnected: (connected) => set({ natsConnected: connected }),

  addSessionEvent: (event) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.set(event.sessionId, event);
      return { sessions: newSessions };
    }),

  removeSession: (sessionId) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.delete(sessionId);
      return { sessions: newSessions };
    }),

  getSession: (sessionId) => get().sessions.get(sessionId),

  clearSessions: () => set({ sessions: new Map() }),
}));
