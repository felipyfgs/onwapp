'use client';

import { Session } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Power, 
  PowerOff, 
  Trash2, 
  ChevronRight,
  MessageSquare,
  Users,
  Contact
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import apiClient from '@/lib/api';

interface SessionCardProps {
  session: Session;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

export function SessionCard({ session, onDelete, onRefresh }: SessionCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isConnected = session.status === 'connected';
  const isConnecting = session.status === 'connecting';

  const handlePower = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      const action = isConnected || isConnecting ? 'disconnect' : 'connect';
      await apiClient.post(`/sessions/${session.session}/${action}`);
      onRefresh?.();
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Excluir esta sessão?')) return;
    setIsLoading(true);
    try {
      await apiClient.delete(`/sessions/${session.session}`);
      onDelete?.(session.id);
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (session.pushName) {
      return session.pushName.substring(0, 2).toUpperCase();
    }
    return session.session.substring(0, 2).toUpperCase();
  };

  return (
    <Link href={`/sessions/${session.session}`}>
      <div className="group flex items-center gap-3 rounded-md border border-border/50 bg-card/50 p-3 hover:bg-accent/50 hover:border-accent transition-all duration-200">
        {/* Avatar Compacto */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={session.profilePicture} alt={session.pushName || session.session} />
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-green-500/80 to-green-600/80 text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
            isConnected ? 'bg-green-500' : 
            isConnecting ? 'bg-yellow-500 animate-pulse' : 
            'bg-zinc-300'
          }`} />
        </div>

        {/* Info Compacta */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm truncate text-foreground/90">
              {session.pushName || session.session}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="truncate font-mono opacity-80">@{session.session}</span>
            {session.phone && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-border" />
                <span className="truncate opacity-80">+{session.phone}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats Minimalistas (apenas ícones e números pequenos) */}
        {isConnected && session.stats && (
          <div className="hidden sm:flex items-center gap-3 px-2">
            <div className="flex items-center gap-1 text-muted-foreground/70" title="Mensagens">
              <MessageSquare className="h-3 w-3" />
              <span className="text-[10px] tabular-nums">{session.stats.messages || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground/70" title="Grupos">
              <Users className="h-3 w-3" />
              <span className="text-[10px] tabular-nums">{session.stats.groups || 0}</span>
            </div>
          </div>
        )}

        {/* Ações Sutis */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePower}
            disabled={isLoading}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            {isConnected || isConnecting ? (
              <PowerOff className="h-3.5 w-3.5" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isLoading}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}