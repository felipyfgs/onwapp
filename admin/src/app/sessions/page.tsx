"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSessions } from "@/hooks/use-api";
import { useNats, useNatsEvent } from "@/hooks/use-nats";
import { SESSION_STATUS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog";
import { SessionStats } from "@/components/sessions/session-stats";
import { SessionFilters } from "@/components/sessions/session-filters";
import { SessionListItem } from "@/components/sessions/session-list-item";
import { toast } from "sonner";

export default function SessionsPage() {
  const router = useRouter();
  const {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    connectSession,
    disconnectSession,
    logoutSession,
    restartSession,
    deleteSession,
  } = useSessions();

  const { events } = useNats();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useNatsEvent("SESSION_CONNECTED", (event) => {
    if (event.sessionId) {
      fetchSessions();
    }
  });

  useNatsEvent("SESSION_DISCONNECTED", (event) => {
    if (event.sessionId) {
      fetchSessions();
    }
  });

  // No need to listen for QR here as it's handled in sub-components or individual session items usually, 
  // but if we need a global QR handler, we can keep it. 
  // For the list view, the QR button is inside the item.

  const handleConnect = async (sessionId: string) => {
    try {
      await connectSession(sessionId);
      toast.success("Comando de conexão enviado");
    } catch (err: any) {
      console.error("Failed to connect session:", err);
      toast.error(err.message || "Falha ao conectar");
    }
  };

  const handleDisconnect = async (sessionId: string) => {
    try {
      await disconnectSession(sessionId);
      toast.success("Comando de desconexão enviado");
    } catch (err: any) {
      console.error("Failed to disconnect session:", err);
      toast.error(err.message || "Falha ao desconectar");
    }
  };

  const handleRestart = async (sessionId: string) => {
    try {
      await restartSession(sessionId);
      toast.success("Reiniciando sessão...");
    } catch (err: any) {
      console.error("Failed to restart session:", err);
      toast.error(err.message || "Falha ao reiniciar");
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão?")) return;
    try {
      await deleteSession(sessionId);
      toast.success("Sessão excluída");
      fetchSessions();
    } catch (err: any) {
      console.error("Failed to delete session:", err);
      toast.error(err.message || "Falha ao excluir");
    }
  };

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];

    return sessions.filter((session) => {
      // Filter by status
      if (filter !== "all") {
        if (filter === "connected" && session.status !== SESSION_STATUS.CONNECTED) return false;
        if (filter === "disconnected" && session.status !== SESSION_STATUS.DISCONNECTED && session.status !== SESSION_STATUS.ERROR) return false;
        if (filter === "connecting" && session.status !== SESSION_STATUS.CONNECTING) return false;
      }

      // Filter by search
      if (search) {
        const searchTerm = search.toLowerCase();
        return (
          session.session.toLowerCase().includes(searchTerm) ||
          session.id.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
  }, [sessions, filter, search]);

  const counts = useMemo(() => {
    if (!sessions) return { total: 0, connected: 0, disconnected: 0, connecting: 0 };
    return {
      total: sessions.length,
      connected: sessions.filter(s => s.status === SESSION_STATUS.CONNECTED).length,
      disconnected: sessions.filter(s => s.status === SESSION_STATUS.DISCONNECTED || s.status === SESSION_STATUS.ERROR).length,
      connecting: sessions.filter(s => s.status === SESSION_STATUS.CONNECTING).length,
    };
  }, [sessions]);

  if (loading && (!sessions || sessions.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sessões</h1>
          <p className="text-muted-foreground">Gerencie suas conexões do WhatsApp</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sessão
        </Button>
      </div>

      <SessionStats counts={counts} />

      <SessionFilters
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        counts={counts}
      />

      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Nenhuma sessão encontrada</h2>
            <p className="text-muted-foreground mb-4">
              {filter !== "all" || search
                ? "Tente ajustar seus filtros ou busca."
                : "Crie uma nova sessão para começar."}
            </p>
            {filter === "all" && !search && (
              <Button onClick={() => setShowCreateDialog(true)}>
                Criar Sessão
              </Button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <SessionListItem
              key={session.id}
              session={session}
              onConnect={() => handleConnect(session.id)}
              onDisconnect={() => handleDisconnect(session.id)}
              onRestart={() => handleRestart(session.id)}
              onDelete={() => handleDelete(session.id)}
            />
          ))
        )}
      </div>

      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSessionCreated={() => {
          setShowCreateDialog(false);
          fetchSessions();
        }}
      />
    </div>
  );
}
