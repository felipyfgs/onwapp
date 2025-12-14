"use client";

import { StatsCard } from "@/components/common";
import { ChatwootOverview, ChatwootStats as ChatwootStatsType } from "@/lib/api";
import { Users, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";

interface ChatwootStatsProps {
  overview: ChatwootOverview | null;
  stats: ChatwootStatsType | null;
  loading?: boolean;
}

export function ChatwootStats({ overview, stats, loading }: ChatwootStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Contacts"
        value={overview?.contactsCount || 0}
        icon={Users}
        variant="chart1"
        loading={loading}
      />
      <StatsCard
        title="Conversations"
        value={overview?.conversationsCount || 0}
        icon={MessageSquare}
        variant="chart2"
        loading={loading}
      />
      <StatsCard
        title="Open"
        value={stats?.open || 0}
        icon={AlertCircle}
        variant="chart4"
        loading={loading}
      />
      <StatsCard
        title="Resolved"
        value={stats?.resolved || 0}
        icon={CheckCircle}
        variant="primary"
        loading={loading}
      />
    </div>
  );
}
