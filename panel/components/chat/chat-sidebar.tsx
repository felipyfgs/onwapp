'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useChatStore } from '@/stores/chat-store';
import apiClient from '@/lib/api';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export function ChatSidebar() {
  const params = useParams();
  const sessionId = params.id as string;
  const { chats, activeChat, setChats, setActiveChat, setLoading } = useChatStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchChats();
  }, [sessionId]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/chat/list`);
      setChats(response.data || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredChats.map((chat) => (
            <button
              key={chat.jid}
              onClick={() => setActiveChat(chat)}
              className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-accent ${
                activeChat?.jid === chat.jid ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(chat.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{chat.name}</p>
                    {chat.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}

          {filteredChats.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
