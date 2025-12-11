"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SessionCard, QRCodeModal, CreateSessionDialog } from "@/components/session";
import {
  getSessions,
  createSession,
  deleteSession,
  connectSession,
  disconnectSession,
  logoutSession,
  restartSession,
  Session,
} from "@/lib/api";
import { useSessionEvents } from "@/hooks/useSessionEvents";
import { SessionEvent } from "@/lib/nats";
import { Plus, RefreshCw, Wifi, WifiOff, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [qrSession, setQrSession] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleEvent = useCallback((event: SessionEvent) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.session === event.session
          ? { ...s, status: event.status as Session["status"] }
          : s
      )
    );

    if (event.event === "session.qr") {
      setQrSession(event.session);
    }
  }, []);

  useSessionEvents(handleEvent);

  const handleCreate = async (name: string) => {
    try {
      const session = await createSession({ session: name });
      setSessions((prev) => [...prev, session]);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleConnect = async (name: string) => {
    try {
      await connectSession(name);
      setQrSession(name);
      fetchSessions();
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = async (name: string) => {
    try {
      await disconnectSession(name);
      fetchSessions();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const handleLogout = async (name: string) => {
    try {
      await logoutSession(name);
      fetchSessions();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleRestart = async (name: string) => {
    try {
      await restartSession(name);
      fetchSessions();
    } catch (error) {
      console.error("Failed to restart:", error);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete session "${name}"?`)) return;
    try {
      await deleteSession(name);
      setSessions((prev) => prev.filter((s) => s.session !== name));
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleOpenSession = (name: string) => {
    router.push(`/sessions/${name}`);
  };

  const connectedCount = sessions.filter((s) => s.status === "connected").length;
  const disconnectedCount = sessions.filter((s) => s.status === "disconnected").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">OnWApp</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchSessions}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900 p-2">
                <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{connectedCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 dark:bg-red-900 p-2">
                <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disconnected</p>
                <p className="text-2xl font-bold">{disconnectedCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">WhatsApp Sessions</h2>
        </div>

        {/* Sessions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </>
          ) : sessions.length === 0 ? (
            <div className="col-span-full rounded-xl border bg-muted/50 p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first WhatsApp session to get started
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onLogout={handleLogout}
                onRestart={handleRestart}
                onDelete={handleDelete}
                onShowQR={setQrSession}
                onOpen={handleOpenSession}
              />
            ))
          )}
        </div>
      </main>

      <CreateSessionDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreate}
      />

      <QRCodeModal
        sessionName={qrSession}
        open={!!qrSession}
        onClose={() => setQrSession(null)}
      />
    </div>
  );
}
