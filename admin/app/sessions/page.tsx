"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { Plus, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionsPage() {
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

  const connectedCount = sessions.filter((s) => s.status === "connected").length;
  const disconnectedCount = sessions.filter((s) => s.status === "disconnected").length;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Sessions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-muted p-2">
                  <Wifi className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected</p>
                  <p className="text-2xl font-bold">{connectedCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-muted p-2">
                  <WifiOff className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disconnected</p>
                  <p className="text-2xl font-bold">{disconnectedCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-muted p-2">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">WhatsApp Sessions</h2>
            <div className="flex gap-2">
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

          {/* Sessions Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <>
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </>
            ) : sessions.length === 0 ? (
              <div className="col-span-full rounded-xl border bg-muted/50 p-8 text-center">
                <p className="text-muted-foreground">No sessions yet</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first session
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
                />
              ))
            )}
          </div>
        </div>

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
      </SidebarInset>
    </SidebarProvider>
  );
}
