'use client';

import { Message } from '@/lib/types/api';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isFromMe = message.fromMe;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('flex', isFromMe ? 'justify-end' : 'justify-start')}>
      <Card
        className={cn(
          'max-w-[70%] p-3',
          isFromMe
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {!isFromMe && message.sender && (
          <p className="mb-1 text-xs font-semibold opacity-70">{message.sender}</p>
        )}

        {message.type === 'text' && message.text && (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        )}

        {message.type === 'image' && message.mediaUrl && (
          <div className="relative h-48 w-64">
            <Image
              src={message.mediaUrl}
              alt="Image message"
              fill
              className="rounded object-cover"
            />
            {message.text && (
              <p className="mt-2 whitespace-pre-wrap break-words">{message.text}</p>
            )}
          </div>
        )}

        {['audio', 'video', 'document', 'sticker'].includes(message.type) && (
          <div className="flex items-center gap-2">
            <p className="text-sm">
              {message.type === 'audio' && '🎵 Áudio'}
              {message.type === 'video' && '🎥 Vídeo'}
              {message.type === 'document' && '📄 Documento'}
              {message.type === 'sticker' && '🎨 Sticker'}
            </p>
            {message.mediaUrl && (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                Abrir
              </a>
            )}
          </div>
        )}

        <p className={cn('mt-1 text-xs', isFromMe ? 'opacity-70' : 'text-muted-foreground')}>
          {formatTime(message.timestamp)}
        </p>
      </Card>
    </div>
  );
}
