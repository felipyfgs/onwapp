"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, MessageSquare, Smartphone, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  icon: React.ElementType;
  description?: string;
  loading?: boolean;
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  description, 
  loading = false 
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            ) : (
              value
            )}
          </div>
          {change && (
            <div className="flex items-center space-x-1 text-xs">
              {change.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={cn(
                "font-medium",
                change.trend === "up" ? "text-green-500" : "text-red-500"
              )}>
                {Math.abs(change.value)}%
              </span>
              <span className="text-muted-foreground">vs última semana</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
    </Card>
  );
}

interface DashboardStatsProps {
  data?: {
    sessions: {
      total: number;
      active: number;
      inactive: number;
    };
    messages: {
      total: number;
      today: number;
      change: number;
    };
    chats: {
      total: number;
      unread: number;
    };
    contacts: {
      total: number;
      new: number;
      change: number;
    };
  };
  loading?: boolean;
}

export function DashboardStats({ data, loading = false }: DashboardStatsProps) {
  const defaultData = {
    sessions: { total: 0, active: 0, inactive: 0 },
    messages: { total: 0, today: 0, change: 0 },
    chats: { total: 0, unread: 0 },
    contacts: { total: 0, new: 0, change: 0 },
  };

  const stats = data || defaultData;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Sessões Ativas"
        value={`${stats.sessions.active}/${stats.sessions.total}`}
        change={{
          value: 12,
          trend: "up"
        }}
        icon={Smartphone}
        description={`${stats.sessions.inactive} inativas`}
        loading={loading}
      />
      <StatCard
        title="Mensagens Hoje"
        value={stats.messages.today.toLocaleString()}
        change={{
          value: stats.messages.change,
          trend: stats.messages.change >= 0 ? "up" : "down"
        }}
        icon={MessageSquare}
        description={`${stats.messages.total} total`}
        loading={loading}
      />
      <StatCard
        title="Conversas"
        value={stats.chats.total}
        icon={Activity}
        description={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {stats.chats.unread} não lidas
            </Badge>
          </div>
        }
        loading={loading}
      />
      <StatCard
        title="Contatos"
        value={stats.contacts.total.toLocaleString()}
        change={{
          value: stats.contacts.change,
          trend: stats.contacts.change >= 0 ? "up" : "down"
        }}
        icon={Users}
        description={`${stats.contacts.new} novos esta semana`}
        loading={loading}
      />
    </div>
  );
}