import { create } from 'zustand';
import type { Contact, Profile } from '@/lib/types/api';

interface ContactState {
  contacts: Contact[];
  loading: boolean;
  setContacts: (contacts: Contact[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useContactStore = create<ContactState>((set) => ({
  contacts: [],
  loading: false,
  setContacts: (contacts) => set({ contacts }),
  setLoading: (loading) => set({ loading }),
}));

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));
