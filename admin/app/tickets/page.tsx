"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ticket as TicketIcon,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  User,
  Users,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSessions,
  getTickets,
  getTicketStats,
  closeTicket,
  reopenTicket,
  deleteTicket,
  type Session,
  type Ticket,
  type TicketStats,
} from "@/lib/api";

export default function TicketsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
      if (data.length > 0 && !selectedSession) {
        setSelectedSession(data[0].session);
      }
    } catch (error) {
      toast.error("Erro ao carregar sessoes");
    }
  };

  const fetchTickets = useCallback(async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const [ticketsRes, statsRes] = await Promise.all([
        getTickets(selectedSession, params),
        getTicketStats(selectedSession),
      ]);
      setTickets(ticketsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  }, [selectedSession, statusFilter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await closeTicket(selectedSession, ticketId);
      toast.success("Ticket fechado");
      fetchTickets();
    } catch (error) {
      toast.error("Erro ao fechar ticket");
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    try {
      await reopenTicket(selectedSession, ticketId);
      toast.success("Ticket reaberto");
      fetchTickets();
    } catch (error) {
      toast.error("Erro ao reabrir ticket");
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicket(selectedSession, ticketId);
      toast.success("Ticket excluido");
      fetchTickets();
    } catch (error) {
      toast.error("Erro ao excluir ticket");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      case "open":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
            <TicketIcon className="mr-1 h-3 w-3" />
            Aberto
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Fechado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader breadcrumbs={[{ label: "Tickets" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-auto">
          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abertos</CardTitle>
                  <TicketIcon className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.open}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fechados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.closed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Inbox className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione a sessao" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.session} value={s.session}>
                    {s.session}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="closed">Fechados</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou numero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" size="icon" onClick={fetchTickets}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Tickets List */}
          <div className="space-y-2">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum ticket encontrado</p>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={ticket.contactPicUrl} />
                      <AvatarFallback className={ticket.isGroup ? "bg-primary text-primary-foreground" : "bg-muted"}>
                        {ticket.isGroup ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          getInitials(ticket.contactName)
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {ticket.contactName || ticket.contactJid}
                        </span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.lastMessage || "Sem mensagens"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {ticket.queue && (
                          <Badge
                            variant="outline"
                            style={{ borderColor: ticket.queue.color, color: ticket.queue.color }}
                          >
                            {ticket.queue.name}
                          </Badge>
                        )}
                        {ticket.user && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.user.name}
                          </span>
                        )}
                        {ticket.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1">
                            {ticket.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {new Date(ticket.updatedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ticket.status !== "closed" && (
                          <DropdownMenuItem onClick={() => handleCloseTicket(ticket.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Fechar
                          </DropdownMenuItem>
                        )}
                        {ticket.status === "closed" && (
                          <DropdownMenuItem onClick={() => handleReopenTicket(ticket.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reabrir
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteTicket(ticket.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
