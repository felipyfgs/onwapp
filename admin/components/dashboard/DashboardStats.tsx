"use client";

import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Smartphone, Activity } from "lucide-react";
import { StatsCard } from "@/components/common";

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
      <StatsCard
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
      <StatsCard
        title="Mensagens Hoje"
        value={stats.messages.today.toLocaleString()}
        change={{
          value: stats.messages.change,
          trend: stats.messages.change >= 0 ? "up" : "down"
        }}
        icon={MessageSquare}
        description={`${stats.messages.total} total`}
        loading={loading}
        variant="chart1"
      />
      <StatsCard
        title="Conversas"
        value={stats.chats.total}
        icon={Activity}
        description={
          <span className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {stats.chats.unread} não lidas
            </Badge>
          </span>
        }
        loading={loading}
        variant="chart2"
      />
      <StatsCard
        title="Contatos"
        value={stats.contacts.total.toLocaleString()}
        change={{
          value: stats.contacts.change,
          trend: stats.contacts.change >= 0 ? "up" : "down"
        }}
        icon={Users}
        description={`${stats.contacts.new} novos esta semana`}
        loading={loading}
        variant="chart3"
      />
    </div>
  );
}
