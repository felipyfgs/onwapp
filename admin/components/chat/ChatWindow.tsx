"use client";

import { useEffect, useRef, useState } from "react";
import { Chat, Message } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Users,
  Archive,
  Trash2,
  Bell,
  BellOff,
  Pin,
  MessageSquare,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  chat: Chat | null;
  messages: Message[];
  loading?: boolean;
  onSendMessage: (text: string) => void;
  onSendMedia?: (type: string, file: File) => void;
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
}

function ChatHeader({ chat, onArchive, onMute, onDelete }: { 
  chat: Chat; 
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
}) {
  const name = chat.name || chat.pushName || chat.jid.split("@")[0];
  const initials = name.substring(0, 2).toUpperCase();
  
  return (
    <div className="flex items-center gap-3 p-3 border-b bg-background shrink-0">
      <Avatar className="h-11 w-11 shadow-sm cursor-pointer">
        {chat.profilePicture && <AvatarImage src={chat.profilePicture} alt={name} />}
        <AvatarFallback className={cn(
          "font-medium",
          chat.isGroup 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground"
        )}>
          {chat.isGroup ? <Users className="h-5 w-5" /> : initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0 cursor-pointer">
        <p className="font-semibold truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          {chat.isGroup ? (
            <>
              <Users className="h-3 w-3" />
              <span>Tap for group info</span>
            </>
          ) : (
            <span>Tap for contact info</span>
          )}
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Users className="h-4 w-4 mr-2" />
              {chat.isGroup ? "Group info" : "Contact info"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Search className="h-4 w-4 mr-2" />
              Search messages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onMute}>
              {chat.isMuted ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Unmute notifications
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Mute notifications
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pin className="h-4 w-4 mr-2" />
              {chat.pinned ? "Unpin chat" : "Pin chat"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="h-4 w-4 mr-2" />
              {chat.isArchived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="px-4 py-1.5 rounded-lg bg-card border border-border/50 text-xs text-muted-foreground font-medium shadow-sm">
        {date}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Select a chat</h3>
      <p className="text-muted-foreground max-w-sm">
        Choose a conversation from the list to start messaging
      </p>
    </div>
  );
}

export function ChatWindow({
  chat,
  messages,
  loading,
  onSendMessage,
  onSendMedia,
  onArchive,
  onMute,
  onDelete,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  if (!chat) {
    return <EmptyState />;
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";
    
    messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp).toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex h-full flex-col bg-muted/30 overflow-hidden">
      {/* Header */}
      <ChatHeader 
        chat={chat} 
        onArchive={onArchive}
        onMute={onMute}
        onDelete={onDelete}
      />
      
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative"
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="py-4 px-2 sm:px-4 overflow-hidden">
            {groupedMessages.map((group, groupIndex) => (
              <div key={group.date}>
                <DateDivider date={group.date} />
                {group.messages.map((message, msgIndex) => {
                  const prevMessage = msgIndex > 0 
                    ? group.messages[msgIndex - 1] 
                    : groupIndex > 0 
                      ? groupedMessages[groupIndex - 1].messages.slice(-1)[0] 
                      : null;
                  
                  const showAvatar = !message.isFromMe && (
                    !prevMessage || 
                    prevMessage.isFromMe || 
                    prevMessage.senderJid !== message.senderJid
                  );
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      showAvatar={showAvatar}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Button
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onSendMedia={onSendMedia}
        disabled={loading}
      />
    </div>
  );
}
