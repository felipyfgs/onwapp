import { useState } from "react";
import type { Route } from "./+types/sessions";
import {
  Plus,
  RefreshCw,
  Smartphone,
  Wifi,
  WifiOff,
  AlertCircle,
  MessageSquare,
  Power,
  PowerOff,
  Trash2,
  QrCode,
  RotateCw,
  LogOut,
  MoreVertical,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "WhatsApp Sessions" },
    { name: "description", content: "Manage your WhatsApp sessions" },
  ];
}

interface Session {
  session_id: string;
  status: "connected" | "disconnected" | "connecting" | "qr" | "pairing";
  phone_number?: string;
  push_name?: string;
  platform?: string;
  connected_at?: string;
}

// Mock data for demonstration
const mockSessions: Session[] = [
  {
    session_id: "session-1",
    status: "connected",
    phone_number: "+55 11 99999-9999",
    push_name: "John Doe",
    platform: "android",
    connected_at: "2024-01-15T10:30:00Z",
  },
  {
    session_id: "session-2",
    status: "disconnected",
    phone_number: "+55 21 88888-8888",
    push_name: "Jane Smith",
    platform: "ios",
  },
  {
    session_id: "session-3",
    status: "qr",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "connected":
      return "default";
    case "connecting":
    case "qr":
    case "pairing":
      return "secondary";
    default:
      return "destructive";
  }
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    connected: "Connected",
    disconnected: "Disconnected",
    connecting: "Connecting...",
    qr: "Awaiting QR",
    pairing: "Pairing...",
  };
  return map[status] || status;
}

function SessionCard({
  session,
  onRefresh,
}: {
  session: Session;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    onRefresh();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Smartphone className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{session.session_id}</CardTitle>
              <CardDescription className="text-xs">
                {session.phone_number || "Not connected"}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getStatusColor(session.status) as any}>
            {getStatusText(session.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm space-y-1">
          {session.push_name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{session.push_name}</span>
            </div>
          )}
          {session.platform && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform:</span>
              <span className="capitalize">{session.platform}</span>
            </div>
          )}
          {session.connected_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connected:</span>
              <span>
                {new Date(session.connected_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          {session.status === "disconnected" && (
            <Button
              size="sm"
              onClick={() => handleAction("connect")}
              disabled={loading}
              className="flex-1"
            >
              <Power className="h-3 w-3 mr-1" />
              Connect
            </Button>
          )}

          {(session.status === "qr" || session.status === "pairing") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("showQR")}
              className="flex-1"
            >
              <QrCode className="h-3 w-3 mr-1" />
              Show QR
            </Button>
          )}

          {session.status === "connected" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("disconnect")}
              disabled={loading}
              className="flex-1"
            >
              <PowerOff className="h-3 w-3 mr-1" />
              Disconnect
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={loading}>
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAction("restart")}>
                <RotateCw className="h-4 w-4 mr-2" />
                Restart
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleAction("logout")}
                disabled={session.status !== "connected"}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleAction("delete")}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateSessionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!sessionId.trim()) {
      setError("Session ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setSessionId("");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Enter a unique identifier for your WhatsApp session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Session ID</label>
            <Input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="e.g., my-session-1"
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <p className="text-xs text-muted-foreground">
              Use only letters, numbers, and hyphens.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !sessionId.trim()}>
            {loading ? "Creating..." : "Create Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Separator />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const stats = {
    total: sessions.length,
    connected: sessions.filter((s) => s.status === "connected").length,
    disconnected: sessions.filter((s) => s.status === "disconnected").length,
  };

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleSessionCreated = () => {
    loadSessions();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  WhatsApp Sessions
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your WhatsApp connections
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={loadSessions}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh sessions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      {!loading && sessions.length > 0 && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">
                        Total Sessions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                      <Wifi className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.connected}
                      </p>
                      <p className="text-xs text-muted-foreground">Connected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                      <WifiOff className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">
                        {stats.disconnected}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Disconnected
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && sessions.length === 0 && <SessionsSkeleton />}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center py-12">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading sessions</AlertTitle>
              <AlertDescription className="mt-2">
                {error}
                <Button
                  onClick={loadSessions}
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sessions.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Card className="max-w-md w-full text-center border-dashed">
              <CardHeader className="pb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Smartphone className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">No Sessions Yet</CardTitle>
                <CardDescription>
                  Create your first WhatsApp session to start sending and
                  receiving messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Session
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sessions Grid */}
        {!loading && !error && sessions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.session_id}
                session={session}
                onRefresh={loadSessions}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Session Dialog */}
      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleSessionCreated}
      />
    </div>
  );
}
