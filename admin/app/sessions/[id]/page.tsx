"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { QRCodeModal } from "@/components/session";
import {
  getSession,
  connectSession,
  disconnectSession,
  logoutSession,
  restartSession,
  getQR,
  Session,
} from "@/lib/api";
import { useSessionEvent } from "@/hooks/useSessionEvents";
import { SessionEvent } from "@/lib/nats";
import {
  Power,
  PowerOff,
  LogOut,
  RefreshCw,
  QrCode,
  Wifi,
  WifiOff,
  MessageSquare,
  Users,
  Phone,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data);
    } catch (error) {
      console.error("Failed to fetch session:", error);
      router.push("/sessions");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleEvent = useCallback((event: SessionEvent) => {
    setSession((prev) =>
      prev ? { ...prev, status: event.status as Session["status"] } : prev
    );

    if (event.event === "session.qr" && event.data?.qrBase64) {
      setQrCode(event.data.qrBase64);
      setShowQR(true);
    } else if (event.event === "session.connected") {
      setShowQR(false);
      fetchSession();
    }
  }, [fetchSession]);

  useSessionEvent(sessionId, handleEvent);

  const handleConnect = async () => {
    try {
      await connectSession(sessionId);
      const qr = await getQR(sessionId);
      if (qr.qr) {
        setQrCode(qr.qr);
        setShowQR(true);
      }
      fetchSession();
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectSession(sessionId);
      fetchSession();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutSession(sessionId);
      fetchSession();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleRestart = async () => {
    try {
      await restartSession(sessionId);
      fetchSession();
    } catch (error) {
      console.error("Failed to restart:", error);
    }
  };

  const statusColor = session?.status === "connected"
    ? "text-green-600"
    : session?.status === "connecting"
    ? "text-yellow-600"
    : "text-red-600";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/sessions">Sessions</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{sessionId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-xl" />
              <div className="grid gap-4 md:grid-cols-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            </div>
          ) : session ? (
            <>
              {/* Session Info Card */}
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold">
                        {session.session.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${
                          session.status === "connected"
                            ? "bg-green-500"
                            : session.status === "connecting"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{session.session}</h1>
                      <p className="text-muted-foreground">
                        {session.phone || session.deviceJid || "Not authenticated"}
                      </p>
                      <p className={`text-sm font-medium ${statusColor}`}>
                        {session.status === "connected"
                          ? "Connected"
                          : session.status === "connecting"
                          ? "Connecting..."
                          : "Disconnected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {session.status === "disconnected" && (
                      <Button onClick={handleConnect}>
                        <Power className="mr-2 h-4 w-4" />
                        Connect
                      </Button>
                    )}
                    {session.status === "connecting" && (
                      <Button variant="outline" onClick={() => setShowQR(true)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Show QR
                      </Button>
                    )}
                    {session.status === "connected" && (
                      <>
                        <Button variant="outline" onClick={handleDisconnect}>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Disconnect
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    )}
                    <Button variant="outline" onClick={handleRestart}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Restart
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Messages</p>
                      <p className="text-2xl font-bold">{session.stats?.messages || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Chats</p>
                      <p className="text-2xl font-bold">{session.stats?.chats || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contacts</p>
                      <p className="text-2xl font-bold">{session.stats?.contacts || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Groups</p>
                      <p className="text-2xl font-bold">{session.stats?.groups || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Placeholder for future content */}
              <div className="rounded-xl border bg-muted/50 p-8 text-center">
                <p className="text-muted-foreground">
                  Session management features coming soon...
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-xl border bg-muted/50 p-8 text-center">
              <p className="text-muted-foreground">Session not found</p>
              <Button className="mt-4" onClick={() => router.push("/sessions")}>
                Back to Sessions
              </Button>
            </div>
          )}
        </div>

        <QRCodeModal
          sessionName={sessionId}
          open={showQR}
          onClose={() => setShowQR(false)}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
