import { useState, useCallback } from "react";
import {
  getChatMessages,
  sendTextMessage,
  markRead,
  archiveChat,
  getTicket,
  type Chat,
  type Message,
  type Ticket,
} from "@/lib/api";
import { toast } from "sonner";

export function useChatCore(session: string) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [ticketListKey, setTicketListKey] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<"open" | "pending">("pending");

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

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.contactJid);
  };

  const refreshSelectedTicket = useCallback(async () => {
    if (!session || !selectedTicket) return;
    try {
      const response = await getTicket(session, selectedTicket.id);
      if (response.data) {
        setSelectedTicket(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh ticket:", error);
    }
  }, [session, selectedTicket]);

  const handleTicketUpdate = useCallback((switchToOpen?: boolean) => {
    if (selectedTicket) {
      if (switchToOpen) {
        setSelectedTicket(prev => prev ? { ...prev, status: "open" } : null);
        setActiveSubTab("open");
        refreshSelectedTicket();
        return;
      }
      fetchMessages(selectedTicket.contactJid);
      refreshSelectedTicket();
    }
    setTicketListKey(k => k + 1);
  }, [selectedTicket, fetchMessages, refreshSelectedTicket]);

  const handleSendMessage = async (text: string) => {
    if (!session || !selectedTicket) return;
    try {
      const sent = await sendTextMessage(session, {
        to: selectedTicket.contactJid,
        text,
      });
      setMessages((prev) => [...prev, sent]);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleArchive = async () => {
    if (!session || !selectedTicket) return;
    try {
      await archiveChat(session, selectedTicket.contactJid, true);
      toast.success("Chat archived");
      // Potentially clear the selected ticket or refresh list
      setSelectedTicket(null);
      setMessages([]);
      setTicketListKey(k => k + 1);
    } catch (error) {
      toast.error("Failed to archive chat");
    }
  };

  const currentChat: Chat | null = selectedTicket ? {
    jid: selectedTicket.contactJid,
    name: selectedTicket.contactName || undefined,
    profilePicture: selectedTicket.contactPicUrl || undefined,
    isGroup: selectedTicket.isGroup,
    unreadCount: selectedTicket.unreadCount,
  } : null;

  const resetChat = () => {
    setSelectedTicket(null);
    setMessages([]);
  }

  return {
    selectedTicket,
    messages,
    loadingMessages,
    ticketListKey,
    activeSubTab,
    currentChat,
    handleSelectTicket,
    handleTicketUpdate,
    handleSendMessage,
    handleArchive,
    setActiveSubTab,
    resetChat,
  };
}
