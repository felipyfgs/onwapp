'use client';

import { Session } from '@/lib/types/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Power, PowerOff, Trash2, ChevronRight } from 'lucide-react';
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

  return (
    <Link href={`/sessions/${session.session}`}>
      <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isConnected ? 'bg-green-500' : 
            isConnecting ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{session.session}</span>
              {isConnected ? (
                <Wifi className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {session.phone && (
              <span className="text-xs text-muted-foreground truncate block">{session.phone}</span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePower}
              disabled={isLoading}
              className="h-8 w-8"
            >
              {isConnected || isConnecting ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isLoading}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </div>
      </Card>
    </Link>
  );
}