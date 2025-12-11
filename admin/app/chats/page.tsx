"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, StatsCard } from "@/components/common";
import { getChats, getSessions, Chat, Session } from "@/lib/api";
import { Search, MessagesSquare, Users, Archive, RefreshCw } from "lucide-react";

export default function ChatsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getSessions()
      .then((data) => {
        const connected = Array.isArray(data) ? data.filter((s) => s.status === "connected") : [];
        setSessions(connected);
        if (connected.length > 0) {
          setSelectedSession(connected[0].session);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchChats = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const data = await getChats(selectedSession);
      setChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
      fetchChats();
    }
  }, [selectedSession, fetchChats]);

  const filteredChats = chats.filter((chat) => {
    const name = chat.name || chat.pushName || chat.jid;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader breadcrumbs={[{ label: "Chats" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchChats}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard title="Total Chats" value={chats.length} icon={MessagesSquare} variant="chart1" />
            <StatsCard title="Groups" value={chats.filter((c) => c.isGroup).length} icon={Users} variant="primary" />
            <StatsCard title="Archived" value={chats.filter((c) => c.isArchived).length} icon={Archive} variant="chart4" />
          </div>

          {/* Chat List */}
          {!selectedSession ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <MessagesSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Select a session</h3>
              <p className="text-muted-foreground">Choose a connected session to view chats</p>
            </div>
          ) : loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <MessagesSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No chats found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "No chats in this session"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              {filteredChats.map((chat) => {
                const name = chat.name || chat.pushName || chat.jid.split("@")[0];
                const initials = name.substring(0, 2).toUpperCase();
                return (
                  <div
                    key={chat.jid}
                    className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => router.push(`/chats/${selectedSession}/${encodeURIComponent(chat.jid)}`)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={chat.isGroup ? "bg-primary/10 text-primary" : ""}>
                        {chat.isGroup ? <Users className="h-5 w-5" /> : initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(chat.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage?.content || "No messages"}
                        </p>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <Badge variant="default" className="ml-auto">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
