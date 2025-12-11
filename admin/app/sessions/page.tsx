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
import { Plus, RefreshCw, Wifi, WifiOff, MessageSquare, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";

type StatusFilter = "all" | "connected" | "disconnected" | "connecting";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [qrSession, setQrSession] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
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
  const connectingCount = sessions.filter((s) => s.status === "connecting").length;

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.session.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.pushName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">OnWApp</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sessions by name, phone or push name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All ({sessions.length})
            </Button>
            <Button
              variant={statusFilter === "connected" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("connected")}
            >
              <Wifi className="mr-2 h-4 w-4" />
              Connected ({connectedCount})
            </Button>
            <Button
              variant={statusFilter === "disconnected" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("disconnected")}
            >
              <WifiOff className="mr-2 h-4 w-4" />
              Disconnected ({disconnectedCount})
            </Button>
            <Button
              variant={statusFilter === "connecting" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("connecting")}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Connecting ({connectingCount})
            </Button>
            <div className="flex-1" />
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

        {/* Sessions List */}
        {loading ? (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-xl border bg-muted/50 p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {sessions.length === 0 ? "No sessions yet" : "No sessions found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {sessions.length === 0
                ? "Create your first WhatsApp session to get started"
                : "Try adjusting your search or filter"}
            </p>
            {sessions.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            {filteredSessions.map((session) => (
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
            ))}
          </div>
        )}
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
