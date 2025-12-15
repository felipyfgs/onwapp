'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useChatStore } from '@/stores/chat-store';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image, Paperclip } from 'lucide-react';

interface MessageInputProps {
  chatJid: string;
}

export function MessageInput({ chatJid }: MessageInputProps) {
  const params = useParams();
  const sessionId = params.id as string;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { addMessage } = useChatStore();

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const response = await apiClient.post(`/sessions/${sessionId}/message/send/text`, {
        jid: chatJid,
        text: text.trim(),
      });

      if (response.data) {
        addMessage({
          id: response.data.id || Date.now().toString(),
          chatJid,
          fromMe: true,
          timestamp: new Date().toISOString(),
          text: text.trim(),
          type: 'text',
        });
      }

      setText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" disabled>
          <Image className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" disabled>
          <Paperclip className="h-5 w-5" />
        </Button>
      </div>

      <Textarea
        placeholder="Digite uma mensagem..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] max-h-[120px]"
        rows={2}
      />

      <Button onClick={handleSend} disabled={!text.trim() || sending} size="icon">
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
