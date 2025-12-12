"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Users, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Clock,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "message" | "session" | "ticket" | "contact" | "system";
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    session?: string;
    contact?: string;
    status?: "success" | "warning" | "error";
  };
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  loading?: boolean;
  onRefresh?: () => void;
}

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "message":
      return MessageSquare;
    case "session":
      return Smartphone;
    case "ticket":
      return CheckCircle;
    case "contact":
      return Users;
    default:
      return AlertCircle;
  }
};

const getActivityColor = (type: ActivityItem["type"], status?: string) => {
  if (status === "error") return "text-red-500 bg-red-50";
  if (status === "warning") return "text-yellow-500 bg-yellow-50";
  
  switch (type) {
    case "message":
      return "text-blue-500 bg-blue-50";
    case "session":
      return "text-green-500 bg-green-50";
    case "ticket":
      return "text-purple-500 bg-purple-50";
    case "contact":
      return "text-orange-500 bg-orange-50";
    default:
      return "text-gray-500 bg-gray-50";
  }
};

const formatTimestamp = (date: Date) => {
  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: ptBR 
  });
};

export function ActivityFeed({ 
  activities = [], 
  loading = false, 
  onRefresh 
}: ActivityFeedProps) {
  const mockActivities: ActivityItem[] = [
    {
      id: "1",
      type: "message",
      title: "Nova mensagem de João Silva",
      description: "Olá, preciso de ajuda com meu pedido",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      user: {
        name: "João Silva",
        avatar: "/avatars/joao.jpg"
      },
      metadata: {
        session: "Session 1",
        status: "success"
      },
      actions: [
        { label: "Responder", action: () => {} },
        { label: "Ver Chat", action: () => {} }
      ]
    },
    {
      id: "2",
      type: "session",
      title: "Sessão WhatsApp conectada",
      description: "Business Session está online",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      metadata: {
        session: "Business Session",
        status: "success"
      }
    },
    {
      id: "3",
      type: "ticket",
      title: "Ticket resolvido",
      description: "Atendimento #1234 finalizado",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      user: {
        name: "Maria Santos"
      },
      metadata: {
        status: "success"
      }
    },
    {
      id: "4",
      type: "contact",
      title: "Novo contato adicionado",
      description: "Pedro Costa adicionado à lista",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      metadata: {
        status: "success"
      }
    },
    {
      id: "5",
      type: "system",
      title: "Backup automático concluído",
      description: "Dados sincronizados com sucesso",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      metadata: {
        status: "success"
      }
    }
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <Card className="border-0 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Atividades Recentes
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {displayActivities.length} itens
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : (
            displayActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type, activity.metadata?.status);
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                    colorClass
                  )}>
                    {activity.user ? (
                      <Avatar className="h-full w-full">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback className="text-xs">
                          {activity.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                        {activity.metadata?.session && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {activity.metadata.session}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {activity.actions && activity.actions.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {activity.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={action.action}
                            className="h-6 text-xs"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* View all link */}
        <div className="mt-4 pt-3 border-t">
          <Button variant="ghost" className="w-full justify-center text-sm">
            Ver todas as atividades
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}