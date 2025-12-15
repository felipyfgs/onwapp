'use client';

import { Session } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Power, 
  PowerOff, 
  Trash2,
  MessageSquare,
  Users,
  Users2,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import apiClient from '@/lib/api';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';

interface SessionCardProps {
  session: Session;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  isSelected?: boolean;
}

export function SessionCard({ session, onDelete, onRefresh, isSelected = false }: SessionCardProps) {
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

  const getStatusIcon = () => {
    if (isConnected) return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    if (isConnecting) return <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />;
    return <AlertCircle className="h-3 w-3 text-zinc-400" />;
  };

  return (
    <Card className="relative rounded-lg border border-border bg-card hover:border-accent hover:bg-accent/50 transition-all duration-200 overflow-hidden">
      <Link href={`/sessions/${session.session}`} className="block">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            {/* Left: Avatar and Info */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 border border-border/50">
                  <AvatarImage src={session.profilePicture} alt={session.pushName || session.session} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-green-500/80 to-green-600/80 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-background ${
                  isConnected ? 'bg-green-500' : 
                  isConnecting ? 'bg-yellow-500 animate-pulse' : 
                  'bg-zinc-300'
                }`} />
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {session.pushName || session.session}
                </h3>
                <p className="text-xs text-muted-foreground font-mono truncate">@{session.session}</p>
                
                {/* Compact Stats */}
                {isConnected && session.stats && (
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{session.stats.messages || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{session.stats.contacts || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users2 className="h-3 w-3" />
                      <span>{session.stats.groups || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right: Status and Actions */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {/* Status Badge */}
              <Badge 
                variant={
                  isConnected ? 'default' : 
                  isConnecting ? 'secondary' : 'destructive'
                }
                className="text-xs w-fit"
              >
                <div className="flex items-center gap-1">
                  {getStatusIcon()}
                  <span>{isConnected ? 'Conectado' : isConnecting ? 'Conectando' : 'Desconectado'}</span>
                </div>
              </Badge>
              
              {/* Actions - Always visible */}
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePower}
                        disabled={isLoading}
                        className="h-6 w-6"
                      >
                        {isConnected || isConnecting ? (
                          <PowerOff className="h-3 w-3" />
                        ) : (
                          <Power className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isConnected || isConnecting ? 'Desconectar' : 'Conectar'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="h-6 w-6 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Excluir sessão
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
