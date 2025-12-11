"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { getChats, getSessions, Chat, Session } from "@/lib/api";
import { Search, MessagesSquare, Users, Archive, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
        setSessions(data.filter((s) => s.status === "connected"));
        if (data.length > 0 && data.some((s) => s.status === "connected")) {
          setSelectedSession(data.find((s) => s.status === "connected")?.session || "");
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
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Chats</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-4">
            <Button variant="outline" size="sm" onClick={fetchChats}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Session Selector & Search */}
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
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900 p-2">
                  <MessagesSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Chats</p>
                  <p className="text-2xl font-bold">{chats.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 dark:bg-green-900 p-2">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Groups</p>
                  <p className="text-2xl font-bold">{chats.filter((c) => c.isGroup).length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 dark:bg-orange-900 p-2">
                  <Archive className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Archived</p>
                  <p className="text-2xl font-bold">{chats.filter((c) => c.isArchived).length}</p>
                </div>
              </div>
            </div>
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
                    className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/chats/${selectedSession}/${encodeURIComponent(chat.jid)}`)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={chat.isGroup ? "bg-green-100 text-green-700" : ""}>
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
