'use client';

import { Session } from '@/lib/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
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
  Clock,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import apiClient from '@/lib/api';

interface SessionCardProps {
  session: Session;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  onQRCodeRequest?: (sessionName: string) => void;
  isSelected?: boolean;
  viewMode?: 'compact' | 'detailed';
}

export function SessionCard({ session, onDelete, onRefresh, onQRCodeRequest, isSelected = false, viewMode = 'compact' }: SessionCardProps) {
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
    <Card className={`relative rounded-lg border border-border bg-card hover:border-accent hover:bg-accent/50 transition-all duration-200 overflow-hidden ${isSelected ? 'border-green-500 bg-green-500/10' : ''}`}>
      <Link href={`/sessions/${session.session}`} className="block">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Header with Avatar and Info */}
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12 border-2 border-border">
                  <AvatarImage src={session.profilePicture} alt={session.pushName || session.session} />
                  <AvatarFallback className="text-sm bg-gradient-to-br from-green-500/80 to-green-600/80 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                  isConnected ? 'bg-green-500' : 
                  isConnecting ? 'bg-yellow-500 animate-pulse' : 
                  'bg-zinc-300'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-foreground truncate">
                    {session.pushName || session.session}
                  </h3>
                  <Badge 
                    variant={
                      isConnected ? 'default' : 
                      isConnecting ? 'secondary' : 'destructive'
                    }
                    className="text-xs"
                  >
                    <div className="flex items-center gap-1">
                      {getStatusIcon()}
                      <span>{isConnected ? 'Conectado' : isConnecting ? 'Conectando' : 'Desconectado'}</span>
                    </div>
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="font-mono truncate">@{session.session}</span>
                  {session.phone && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="truncate">+{session.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            {isConnected && session.stats && (
              <div className="flex items-center gap-4 text-sm border-t border-border/50 pt-3 mt-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium text-foreground">{session.stats.messages || 0}</span>
                  <span className="text-muted-foreground">mensagens</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-foreground">{session.stats.contacts || 0}</span>
                  <span className="text-muted-foreground">contatos</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  <span className="font-medium text-foreground">{session.stats.groups || 0}</span>
                  <span className="text-muted-foreground">grupos</span>
                </div>
              </div>
            )}

            {/* Action Buttons - Horizontal Layout */}
            <div className="flex items-center gap-2 mt-3 border-t border-border/50 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePower(e);
                }}
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                {isConnected || isConnecting ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                <span>{isConnected || isConnecting ? 'Desconectar' : 'Conectar'}</span>
              </Button>

              {onQRCodeRequest && !isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onQRCodeRequest(session.session);
                  }}
                  className="gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span>QR Code</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(e);
                }}
                disabled={isLoading}
                className="gap-2 text-destructive border-destructive/30 hover:border-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
