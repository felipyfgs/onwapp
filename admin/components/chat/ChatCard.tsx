"use client";

import { Chat } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { formatChatTime } from "@/lib/date-utils";

interface ChatCardProps {
  chat: Chat;
  onClick?: (chat: Chat) => void;
}

export function ChatCard({ chat, onClick }: ChatCardProps) {
  const name = chat.name || chat.contactName || chat.jid.split("@")[0];
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div
      className={`flex items-center gap-4 p-4 border-b last:border-b-0 transition-colors ${onClick ? "hover:bg-accent cursor-pointer" : ""
        }`}
      onClick={() => onClick?.(chat)}
    >
      <Avatar className="h-12 w-12">
        {chat.profilePicture && <AvatarImage src={chat.profilePicture} alt={name} />}
        <AvatarFallback className={chat.isGroup ? "bg-primary/10 text-primary" : ""}>
          {chat.isGroup ? <Users className="h-5 w-5" /> : initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium truncate">{name}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {chat.conversationTimestamp ? formatChatTime(chat.conversationTimestamp) : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground truncate flex-1">
            {chat.lastMessage?.content || "No messages"}
          </p>
          {chat.unreadCount && chat.unreadCount > 0 && (
            <Badge variant="default" className="flex-shrink-0">
              {chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
