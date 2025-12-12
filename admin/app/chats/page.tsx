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
import { ChatSidebar, ChatWindow } from "@/components/chat";
import {
  getChats,
  getChatMessages,
  getSessions,
  sendTextMessage,
  markRead,
  archiveChat,
  Chat,
  Message,
  Session,
} from "@/lib/api";
import { RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";

export default function ChatsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    getSessions()
      .then((data) => {
        const connected = Array.isArray(data) ? data.filter((s) => s.status === "connected") : [];
        setSessions(connected);
        if (connected.length > 0) {
          setSelectedSession(connected[0].session);
        }
      })
      .finally(() => setLoadingChats(false));
  }, []);

  // Fetch chats when session changes
  const fetchChats = useCallback(async () => {
    if (!selectedSession) return;
    setLoadingChats(true);
    try {
      const data = await getChats(selectedSession);
      setChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      fetchChats();
      setSelectedChat(null);
      setMessages([]);
    }
  }, [selectedSession, fetchChats]);

  // Fetch messages when chat is selected
  const fetchMessages = useCallback(async (jid: string) => {
    if (!selectedSession || !jid) return;
    setLoadingMessages(true);
    try {
      const data = await getChatMessages(selectedSession, jid, 100);
      setMessages(Array.isArray(data) ? data : []);
      // Mark as read
      await markRead(selectedSession, jid).catch(() => {});
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedSession]);

  const handleSelectChat = (jid: string) => {
    setSelectedChat(jid);
    fetchMessages(jid);
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedSession || !selectedChat) return;
    try {
      const sent = await sendTextMessage(selectedSession, {
        to: selectedChat,
        text,
      });
      setMessages((prev) => [...prev, sent]);
      // Update chat list
      fetchChats();
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleArchive = async () => {
    if (!selectedSession || !selectedChat) return;
    const chat = chats.find((c) => c.jid === selectedChat);
    if (!chat) return;
    try {
      await archiveChat(selectedSession, selectedChat, !chat.isArchived);
      toast.success(chat.isArchived ? "Chat unarchived" : "Chat archived");
      fetchChats();
    } catch (error) {
      toast.error("Failed to archive chat");
    }
  };

  const currentChat = chats.find((c) => c.jid === selectedChat) || null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden min-w-0">
        <PageHeader
          breadcrumbs={[{ label: "Chats" }]}
          actions={
            <div className="flex items-center gap-2">
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.session} value={s.session}>
                      {s.pushName || s.session}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchChats}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          }
        />
        
        <div className="flex-1 min-h-0 overflow-hidden">
          {!selectedSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Select a session</h3>
                <p className="text-muted-foreground">
                  Choose a connected WhatsApp session to start chatting
                </p>
              </div>
            </div>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full overflow-hidden">
              <ResizablePanel defaultSize={35} minSize={25} maxSize={45} className="min-w-0">
                <div className="h-full w-full overflow-hidden">
                  <ChatSidebar
                    chats={chats}
                    selectedChat={selectedChat || undefined}
                    onSelectChat={handleSelectChat}
                    loading={loadingChats}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={65} className="min-w-0">
                <div className="h-full w-full overflow-hidden">
                  <ChatWindow
                    chat={currentChat}
                    messages={messages}
                    loading={loadingMessages}
                    onSendMessage={handleSendMessage}
                    onArchive={handleArchive}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
