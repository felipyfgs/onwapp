"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessions } from "@/hooks/use-api";
import { useNats, useNatsEvent } from "@/hooks/use-nats";
import { SESSION_STATUS, NATS_EVENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle, Plus } from "lucide-react";
import { SessionCard } from "@/components/sessions/session-card";
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog";
import { QRCodeDialog } from "@/components/sessions/qr-code-dialog";

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
  const { isConnected, events } = useNats();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [qrCode, setQRCode] = useState<string | null>(null);

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

  useNatsEvent("SESSION_QR", (event) => {
    if (event.sessionId === currentSessionId && event.data?.qr) {
      setQRCode(event.data.qr);
      setShowQRDialog(true);
    }
  });

  const handleCreateSession = async (sessionName: string) => {
    try {
      await createSession({ session: sessionName });
      setShowCreateDialog(false);
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleConnect = async (sessionId: string) => {
    try {
      await connectSession(sessionId);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error("Failed to connect session:", err);
    }
  };

  const handleDisconnect = async (sessionId: string) => {
    try {
      await disconnectSession(sessionId);
    } catch (err) {
      console.error("Failed to disconnect session:", err);
    }
  };

  const handleLogout = async (sessionId: string) => {
    try {
      await logoutSession(sessionId);
    } catch (err) {
      console.error("Failed to logout session:", err);
    }
  };

  const handleRestart = async (sessionId: string) => {
    try {
      await restartSession(sessionId);
    } catch (err) {
      console.error("Failed to restart session:", err);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      fetchSessions();
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case SESSION_STATUS.CONNECTED:
        return <Badge variant="default">Conectado</Badge>;

      case SESSION_STATUS.CONNECTING:
        return <Badge variant="secondary">Conectando</Badge>;

      case SESSION_STATUS.QR:
        return <Badge variant="secondary">QR Code</Badge>;

      case SESSION_STATUS.ERROR:
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  if (loading && (!sessions || sessions.length === 0)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
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
        <h1 className="text-2xl font-bold">Sessões WhatsApp</h1>
        <Button onClick={() => setShowCreateDialog(true)}>Nova Sessão</Button>
      </div>

      {sessions && sessions.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Nenhuma sessão encontrada</h2>
          <p className="text-gray-500 mb-4">
            Crie uma nova sessão para começar a gerenciar seu WhatsApp
          </p>
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            Criar Sessão
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions && sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onLogout={handleLogout}
              onRestart={handleRestart}
              onDelete={handleDelete}
              onViewDetails={() => router.push(`/sessions/${session.id}`)}
            />
          ))}
        </div>
      )}

      <CreateSessionDialog
        onSessionCreated={() => setShowCreateDialog(false)}
      >
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sessão
        </Button>
      </CreateSessionDialog>

      <QRCodeDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        sessionId={currentSessionId || ''}
      />
    </div>
  );
}
