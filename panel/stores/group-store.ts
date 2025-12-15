import { create } from 'zustand';
import type { Group } from '@/lib/types/api';

interface GroupState {
  groups: Group[];
  selectedGroup: Group | null;
  loading: boolean;
  setGroups: (groups: Group[]) => void;
  setSelectedGroup: (group: Group | null) => void;
  addGroup: (group: Group) => void;
  updateGroup: (jid: string, updates: Partial<Group>) => void;
  removeGroup: (jid: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  selectedGroup: null,
  loading: false,

  setGroups: (groups) => set({ groups }),

  setSelectedGroup: (group) => set({ selectedGroup: group }),

  addGroup: (group) =>
    set((state) => ({
      groups: [...state.groups, group],
    })),

  updateGroup: (jid, updates) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.jid === jid ? { ...g, ...updates } : g)),
    })),

  removeGroup: (jid) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.jid !== jid),
    })),

  setLoading: (loading) => set({ loading }),
}));
