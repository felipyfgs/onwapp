"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  MessageSquare,
  Users,
  Smartphone,
  Settings,
  Clock,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "message" | "session" | "system";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: {
    session?: string;
    contact?: string;
    priority?: "low" | "medium" | "high";
  };
}

interface NotificationCenterProps {
  className?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "Nova mensagem de João Silva",
    description: "Olá, preciso de ajuda com meu pedido #1234",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    metadata: {
      contact: "João Silva",
      priority: "high"
    },
    action: {
      label: "Responder",
      onClick: () => {}
    }
  },
  {
    id: "2",
    type: "session",
    title: "Sessão desconectada",
    description: "Business Session perdeu a conexão com WhatsApp",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    metadata: {
      session: "Business Session",
      priority: "high"
    },
    action: {
      label: "Reconectar",
      onClick: () => {}
    }
  },
  {
    id: "3",
    type: "system",
    title: "Backup automático concluído",
    description: "Seus dados foram sincronizados com sucesso",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    metadata: {
      priority: "low"
    }
  },
  {
    id: "4",
    type: "info",
    title: "Novo contato adicionado",
    description: "Maria Santos foi adicionada à sua lista",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    metadata: {
      contact: "Maria Santos",
      priority: "medium"
    }
  },
  {
    id: "5",
    type: "warning",
    title: "Limite de mensagens próximo",
    description: "Você utilizou 85% do seu limite mensal",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    metadata: {
      priority: "medium"
    },
    action: {
      label: "Ver plano",
      onClick: () => {}
    }
  }
];

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "important">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const importantCount = notifications.filter(n => n.metadata?.priority === "high").length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return MessageSquare;
      case "session":
        return Smartphone;
      case "system":
        return Settings;
      case "success":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: Notification["type"], priority?: string) => {
    if (priority === "high") return "text-red-500 bg-red-50 border-red-200";
    if (priority === "medium") return "text-yellow-500 bg-yellow-50 border-yellow-200";
    
    switch (type) {
      case "message":
        return "text-blue-500 bg-blue-50 border-blue-200";
      case "session":
        return "text-green-500 bg-green-50 border-green-200";
      case "success":
        return "text-green-500 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-500 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-500 bg-red-50 border-red-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const filteredNotifications = notifications.filter(n => {
    switch (filter) {
      case "unread":
        return !n.read;
      case "important":
        return n.metadata?.priority === "high";
      default:
        return true;
    }
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className={cn("relative", className)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden border shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs h-7"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-1">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="text-xs"
              >
                Todas ({notifications.length})
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("unread")}
                className="text-xs"
              >
                Não lidas ({unreadCount})
              </Button>
              <Button
                variant={filter === "important" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("important")}
                className="text-xs"
              >
                Importantes ({importantCount})
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {filter === "unread" 
                      ? "Nenhuma notificação não lida" 
                      : filter === "important"
                      ? "Nenhuma notificação importante"
                      : "Nenhuma notificação"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(
                      notification.type, 
                      notification.metadata?.priority
                    );
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 hover:bg-muted/30 transition-colors cursor-pointer border-l-4",
                          colorClass,
                          !notification.read && "bg-muted/20"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-tight">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {notification.description}
                                </p>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(notification.timestamp)}
                              </div>
                              
                              {notification.action && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notification.action!.onClick();
                                  }}
                                  className="text-xs h-6"
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Limpar todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-xs"
                >
                  Ver todas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}