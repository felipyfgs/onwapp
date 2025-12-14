"use client";

import React, { useEffect, useRef } from "react";
import { Chat, Message } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Users,
  Archive,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  chat: Chat | null;
  messages: Message[];
  loading?: boolean;
  onSendMessage: (text: string) => void;
  onArchive?: () => void;
  session?: string;
}

interface ChatHeaderProps {
  chat: Chat;
  onArchive?: () => void;
}

function ChatHeader({ chat, onArchive }: ChatHeaderProps) {
  const name = chat.name || chat.contactName || chat.jid.split("@")[0];
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarImage src={chat.profilePicture} alt={name} />
          <AvatarFallback className={cn(
            chat.isGroup
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
              : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
          )}>
            {chat.isGroup ? <Users className="h-5 w-5" /> : initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm truncate">{name}</h2>
            {chat.isGroup && <Users className="h-3 w-3 text-muted-foreground shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {chat.isGroup ? "Grupo" : "Chat individual"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Video className="h-4 w-4" />
        </Button>
        {onArchive && (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onArchive}>
            <Archive className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ChatWindow({
  chat,
  messages,
  loading,
  onSendMessage,
  onArchive,
  session,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [chat?.jid]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isFromMe) {
      scrollToBottom();
    }
  }, [messages]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    setShowScrollButton(distanceFromBottom > 300);
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <p className="text-muted-foreground">Selecione um chat para começar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader chat={chat} onArchive={onArchive} />

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Carregando mensagens...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Envie uma mensagem para começar a conversa
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-24 right-8 h-10 w-10 rounded-full shadow-lg z-10"
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}

      <div className="border-t p-4 bg-card">
        <MessageInput onSendMessage={onSendMessage} disabled={loading} />
      </div>
    </div>
  );
}
