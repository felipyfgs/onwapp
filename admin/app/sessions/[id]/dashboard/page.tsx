"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/common";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings
} from "lucide-react";
import { getSessions } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardData {
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
}

export default function DashboardPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [data, setData] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const sessions = await getSessions();

      const activeSessions = sessions.filter(s => s.status === "connected").length;
      const totalSessions = sessions.length;

      setData({
        sessions: {
          total: totalSessions,
          active: activeSessions,
          inactive: totalSessions - activeSessions
        },
        messages: {
          total: 1234,
          today: 45,
          change: 12
        },
        chats: {
          total: 0,
          unread: 0
        },
        contacts: {
          total: 567,
          new: 23,
          change: 8
        }
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader
          breadcrumbs={[
            { label: "Sessions", href: "/sessions" },
            { label: sessionId, href: `/sessions/${sessionId}` },
            { label: "Dashboard" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </div>
          }
        />

        <div className="flex flex-1 flex-col gap-6 p-4 pt-0 overflow-auto">
          {/* Stats Overview */}
          <DashboardStats data={data} loading={loading} />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <QuickActions
                sessionCount={data?.sessions.total}
                unreadChats={data?.chats.unread}
                unreadMessages={data?.messages.today}
              />
            </div>

            {/* System Status */}
            <Card className="border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">API WhatsApp</span>
                    <Badge variant="default" className="bg-green-500">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Banco de Dados</span>
                    <Badge variant="default" className="bg-green-500">
                      Conectado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Webhooks</span>
                    <Badge variant="default" className="bg-green-500">
                      Ativos
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Storage</span>
                    <Badge variant="outline">
                      68% usado
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Última verificação: há 2 minutos
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ActivityFeed loading={loading} onRefresh={handleRefresh} />
            </div>

            {/* Quick Stats */}
            <Card className="border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Métricas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Taxa de Resposta</span>
                    </div>
                    <span className="text-sm font-medium">92%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Satisfação</span>
                    </div>
                    <span className="text-sm font-medium">4.8/5</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Conversões</span>
                    </div>
                    <span className="text-sm font-medium">+23%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Alertas</span>
                    </div>
                    <span className="text-sm font-medium">2</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  Ver Relatórios Completos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
