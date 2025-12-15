import { create } from 'zustand';
import type { Chat, Message } from '@/lib/types/api';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  loading: boolean;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateChatLastMessage: (chatJid: string, message: string, time: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  loading: false,

  setChats: (chats) => set({ chats }),

  setActiveChat: (chat) => set({ activeChat: chat, messages: [] }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateChatLastMessage: (chatJid, message, time) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.jid === chatJid
          ? { ...chat, lastMessage: message, lastMessageTime: time }
          : chat
      ),
    })),

  setLoading: (loading) => set({ loading }),
}));
