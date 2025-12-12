"use client";

import { useState, useMemo } from "react";
import { Chat } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Archive,
  MessageSquare,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  chats: Chat[];
  selectedChat?: string;
  onSelectChat: (jid: string) => void;
  loading?: boolean;
}

type FilterType = "all" | "unread" | "groups" | "archived";

function formatTime(timestamp?: string): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ChatSidebar({ chats, selectedChat, onSelectChat, loading }: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const name = (chat.name || chat.pushName || chat.jid).toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      
      if (!matchesSearch) return false;
      
      switch (filter) {
        case "unread":
          return (chat.unreadCount || 0) > 0;
        case "groups":
          return chat.isGroup;
        case "archived":
          return chat.isArchived;
        default:
          return !chat.isArchived;
      }
    });
  }, [chats, search, filter]);

  const stats = useMemo(() => ({
    total: chats.filter(c => !c.isArchived).length,
    unread: chats.filter(c => (c.unreadCount || 0) > 0).length,
    groups: chats.filter(c => c.isGroup).length,
    archived: chats.filter(c => c.isArchived).length,
  }), [chats]);

  return (
    <div className="flex h-full flex-col border-r bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b p-4 space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-8"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearch("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-1">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setFilter("all")}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            All
            <Badge variant="outline" className="ml-1 h-5 px-1.5">{stats.total}</Badge>
          </Button>
          <Button
            variant={filter === "unread" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setFilter("unread")}
          >
            Unread
            {stats.unread > 0 && (
              <Badge className="ml-1 h-5 px-1.5">{stats.unread}</Badge>
            )}
          </Button>
          <Button
            variant={filter === "groups" ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setFilter("groups")}
          >
            <Users className="h-3.5 w-3.5 mr-1" />
            {stats.groups}
          </Button>
          <Button
            variant={filter === "archived" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            onClick={() => setFilter("archived")}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No chats found</p>
            <p className="text-sm">
              {search ? "Try a different search" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div>
            {filteredChats.map((chat) => {
              const name = chat.name || chat.pushName || chat.jid.split("@")[0];
              const initials = name.substring(0, 2).toUpperCase();
              const isSelected = selectedChat === chat.jid;
              
              return (
                <div
                  key={chat.jid}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer transition-colors border-l-2 border-transparent",
                    isSelected 
                      ? "bg-accent border-l-primary" 
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => onSelectChat(chat.jid)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 shadow-sm">
                      {chat.profilePicture && (
                        <AvatarImage src={chat.profilePicture} alt={name} />
                      )}
                      <AvatarFallback className={cn(
                        "font-medium",
                        chat.isGroup 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {chat.isGroup ? <Users className="h-5 w-5" /> : initials}
                      </AvatarFallback>
                    </Avatar>
                    {chat.isMuted && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background border border-border flex items-center justify-center">
                        <span className="text-[9px]">🔇</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        "font-medium truncate",
                        (chat.unreadCount || 0) > 0 && "font-semibold"
                      )}>
                        {name}
                      </p>
                      <span className={cn(
                        "text-xs shrink-0",
                        (chat.unreadCount || 0) > 0 
                          ? "text-primary font-medium" 
                          : "text-muted-foreground"
                      )}>
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm truncate flex-1",
                        (chat.unreadCount || 0) > 0 
                          ? "text-foreground" 
                          : "text-muted-foreground"
                      )}>
                        {chat.lastMessage?.content || "No messages"}
                      </p>
                      {(chat.unreadCount || 0) > 0 && (
                        <Badge className="shrink-0 h-5 min-w-5 px-1.5 justify-center">
                          {chat.unreadCount}
                        </Badge>
                      )}
                      {chat.pinned && (
                        <span className="text-xs">📌</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
