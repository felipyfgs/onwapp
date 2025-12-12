"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PageHeader } from "@/components/common";
import { TicketManager, ChatWindow } from "@/components/chat";
import {
  getChatMessages,
  getSessions,
  sendTextMessage,
  markRead,
  archiveChat,
  closeTicket,
  reopenTicket,
  transferTicket,
  getQueues,
  type Chat,
  type Message,
  type Session,
  type Ticket,
  type Queue,
} from "@/lib/api";
import { Settings, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";

export default function ChatsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [queues, setQueues] = useState<Queue[]>([]);

  // Load sessions on mount
  useEffect(() => {
    getSessions()
      .then((data) => {
        const connected = Array.isArray(data) ? data.filter((s) => s.status === "connected") : [];
        setSessions(connected);
        if (connected.length > 0) {
          setSelectedSession(connected[0].session);
        }
      });
    
    getQueues()
      .then((response) => setQueues(response.data || []))
      .catch(() => {});
  }, []);

  // Fetch messages when ticket is selected
  const fetchMessages = useCallback(async (contactJid: string) => {
    if (!selectedSession || !contactJid) return;
    setLoadingMessages(true);
    try {
      const data = await getChatMessages(selectedSession, contactJid, 100);
      setMessages(Array.isArray(data) ? data : []);
      // Mark as read
      await markRead(selectedSession, contactJid).catch(() => {});
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedSession]);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.contactJid);
  };

  const handleTicketUpdate = () => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.contactJid);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedSession || !selectedTicket) return;
    try {
      const sent = await sendTextMessage(selectedSession, {
        to: selectedTicket.contactJid,
        text,
      });
      setMessages((prev) => [...prev, sent]);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleArchive = async () => {
    if (!selectedSession || !selectedTicket) return;
    try {
      await archiveChat(selectedSession, selectedTicket.contactJid, true);
      toast.success("Chat archived");
    } catch (error) {
      toast.error("Failed to archive chat");
    }
  };

  // Convert ticket to chat format for ChatWindow
  const currentChat: Chat | null = selectedTicket ? {
    jid: selectedTicket.contactJid,
    name: selectedTicket.contactName || undefined,
    profilePicture: selectedTicket.contactPicUrl || undefined,
    isGroup: selectedTicket.isGroup,
    unreadCount: selectedTicket.unreadCount,
  } : null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden min-w-0">
        <PageHeader
          breadcrumbs={[{ label: "Chats" }]}
          actions={
            <div className="flex items-center gap-2">
              <Select value={selectedSession} onValueChange={(value) => {
                setSelectedSession(value);
                setSelectedTicket(null);
                setMessages([]);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecionar sessao" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.session} value={s.session}>
                      {s.pushName || s.session}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
        
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
          {!selectedSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Selecione uma sessao</h3>
                <p className="text-muted-foreground">
                  Escolha uma sessao WhatsApp conectada para iniciar
                </p>
              </div>
            </div>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={35} minSize={25} maxSize={45}>
                <TicketManager
                  session={selectedSession}
                  selectedTicket={selectedTicket}
                  onSelectTicket={handleSelectTicket}
                  onTicketUpdate={handleTicketUpdate}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={65}>
                {selectedTicket ? (
                  <ChatWindow
                    chat={currentChat}
                    messages={messages}
                    loading={loadingMessages}
                    onSendMessage={handleSendMessage}
                    onArchive={handleArchive}
                    ticket={selectedTicket}
                    session={selectedSession}
                    queues={queues}
                    onTicketAction={handleTicketUpdate}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/30">
                    <div className="text-center">
                      <TicketIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">Selecione um ticket</h3>
                      <p className="text-muted-foreground">
                        Escolha um ticket na lista para ver a conversa
                      </p>
                    </div>
                  </div>
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
