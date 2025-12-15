'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useChatStore } from '@/stores/chat-store';
import apiClient from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';

export function ChatWindow() {
  const params = useParams();
  const sessionId = params.id as string;
  const { activeChat, messages, setMessages, setLoading } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeChat) {
      fetchMessages();
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!activeChat) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/chat/messages`, {
        params: { jid: activeChat.jid },
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  if (!activeChat) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma conversa selecionada</p>
          <p className="text-sm">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background p-4">
        <h2 className="font-semibold">{activeChat.name}</h2>
        <p className="text-sm text-muted-foreground">{activeChat.jid}</p>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <MessageInput chatJid={activeChat.jid} />
      </div>
    </div>
  );
}
