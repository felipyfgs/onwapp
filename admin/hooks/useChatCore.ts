import { useState, useCallback } from "react";
import {
  getChatMessages,
  sendTextMessage,
  markRead,
  archiveChat,
  type Chat,
  type Message,
} from "@/lib/api";
import { toast } from "sonner";

export function useChatCore(session: string) {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatListKey, setChatListKey] = useState(0);

  const fetchMessages = useCallback(async (contactJid: string) => {
    if (!session || !contactJid) return;
    setLoadingMessages(true);
    try {
      const data = await getChatMessages(session, contactJid, 100);
      setMessages(Array.isArray(data) ? data : []);
      // Mark as read
      await markRead(session, contactJid).catch(() => {});
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [session]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.jid);
  };

  const handleSendMessage = async (text: string) => {
    if (!session || !selectedChat) return;
    try {
      const sent = await sendTextMessage(session, {
        to: selectedChat.jid,
        text,
      });
      setMessages((prev) => [...prev, sent]);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleArchive = async () => {
    if (!session || !selectedChat) return;
    try {
      await archiveChat(session, selectedChat.jid, true);
      toast.success("Chat archived");
      setSelectedChat(null);
      setMessages([]);
      setChatListKey(k => k + 1);
    } catch (error) {
      toast.error("Failed to archive chat");
    }
  };

  const resetChat = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  return {
    selectedChat,
    messages,
    loadingMessages,
    chatListKey,
    currentChat: selectedChat,
    handleSelectChat,
    handleSendMessage,
    handleArchive,
    resetChat,
  };
}
