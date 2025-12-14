"use client";

import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare } from "lucide-react";
import { type Chat } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatListItemProps {
  chat: Chat;
  selected: boolean;
  onClick: () => void;
}

function ChatListItemComponent({
  chat,
  selected,
  onClick,
}: ChatListItemProps) {
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const displayName = chat.name || chat.contactName || chat.jid.split("@")[0];

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-3 cursor-pointer transition-all duration-200 hover:bg-muted/30 active:scale-[0.98] min-h-[72px] max-h-[72px]",
        selected && "bg-accent/50 border-l-3 border-l-primary shadow-sm"
      )}
      onClick={onClick}
      role="listitem"
      aria-label={`Chat com ${displayName}`}
      aria-selected={selected}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-11 w-11 shadow-sm ring-2 ring-background transition-transform group-hover:scale-105">
          <AvatarImage src={chat.profilePicture} alt={displayName} />
          <AvatarFallback
            className={cn(
              "font-medium text-sm",
              chat.isGroup
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
            )}
          >
            {chat.isGroup ? (
              <Users className="h-5 w-5" />
            ) : (
              getInitials(displayName)
            )}
          </AvatarFallback>
        </Avatar>

        {/* Unread Indicator */}
        {chat.unreadCount && chat.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1 max-h-16 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 max-w-[180px]">
            <h3 className="font-semibold text-sm truncate">
              {displayName}
            </h3>
            {chat.isGroup && (
              <Users className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {chat.updatedAt && (
              <span className="text-xs text-muted-foreground font-medium">
                {formatTime(chat.updatedAt)}
              </span>
            )}
            {chat.unreadCount && chat.unreadCount > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Last Message */}
        {chat.lastMessage && (
          <div className="flex items-start gap-2 max-h-8 overflow-hidden">
            <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {chat.lastMessage.content || "Mídia"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const ChatListItem = memo(ChatListItemComponent, (prev, next) => {
  return (
    prev.chat.jid === next.chat.jid &&
    prev.chat.unreadCount === next.chat.unreadCount &&
    prev.chat.updatedAt === next.chat.updatedAt &&
    prev.selected === next.selected
  );
});
