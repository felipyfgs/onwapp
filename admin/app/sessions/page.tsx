"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionCard, QRCodeModal, CreateSessionDialog } from "@/components/session";
import { StatsCard } from "@/components/common";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { Plus, RefreshCw, Wifi, WifiOff, Loader2, Search, Smartphone, MessageSquare } from "lucide-react";

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

  const filterButtons: { label: string; value: StatusFilter; count: number }[] = [
    { label: "All", value: "all", count: sessions.length },
    { label: "Connected", value: "connected", count: connectedCount },
    { label: "Disconnected", value: "disconnected", count: disconnectedCount },
    { label: "Connecting", value: "connecting", count: connectingCount },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">OnWApp</span>
              <span className="text-xs text-muted-foreground">Session Manager</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-6 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard title="Connected" value={connectedCount} icon={Wifi} variant="primary" />
            <StatsCard title="Disconnected" value={disconnectedCount} icon={WifiOff} variant="chart4" />
            <StatsCard title="Connecting" value={connectingCount} icon={Loader2} variant="chart2" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant={statusFilter === btn.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(btn.value)}
                >
                  {btn.label} ({btn.count})
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Button>
              <Button variant="outline" size="sm" onClick={fetchSessions}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Session List */}
          {loading ? (
            <div className="rounded-xl border bg-card overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No sessions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter"
                  : "Create your first session to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && (
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
                  key={session.session}
                  session={session}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onLogout={handleLogout}
                  onRestart={handleRestart}
                  onDelete={handleDelete}
                  onShowQR={() => setQrSession(session.session)}
                  onOpen={handleOpenSession}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateSessionDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreate}
      />

      <QRCodeModal
        open={!!qrSession}
        onClose={() => setQrSession(null)}
        sessionName={qrSession || ""}
      />
    </div>
  );
}
