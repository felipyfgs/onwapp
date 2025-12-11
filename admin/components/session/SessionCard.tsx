"use client";

import { Session } from "@/lib/api";
import {
  MoreVertical,
  Power,
  PowerOff,
  LogOut,
  RefreshCw,
  Trash2,
  QrCode,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SessionCardProps {
  session: Session;
  onConnect: (name: string) => void;
  onDisconnect: (name: string) => void;
  onLogout: (name: string) => void;
  onRestart: (name: string) => void;
  onDelete: (name: string) => void;
  onShowQR: (name: string) => void;
  onOpen?: (name: string) => void;
}

export function SessionCard({
  session,
  onConnect,
  onDisconnect,
  onLogout,
  onRestart,
  onDelete,
  onShowQR,
  onOpen,
}: SessionCardProps) {
  const statusColor = {
    connected: "bg-green-500",
    disconnected: "bg-red-500",
    connecting: "bg-yellow-500",
  }[session.status];

  const statusText = {
    connected: "Connected",
    disconnected: "Disconnected",
    connecting: "Connecting...",
  }[session.status];

  const handleCardClick = () => {
    if (onOpen && session.status === "connected") {
      onOpen(session.session);
    }
  };

  return (
    <div
      className={`rounded-lg border bg-card p-4 shadow-sm transition-colors ${
        onOpen && session.status === "connected"
          ? "cursor-pointer hover:bg-accent/50"
          : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
              {session.session.charAt(0).toUpperCase()}
            </div>
            <div
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColor}`}
            />
          </div>
          <div>
            <h3 className="font-semibold">{session.session}</h3>
            <p className="text-sm text-muted-foreground">
              {session.phone || session.deviceJid || "Not authenticated"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onOpen && session.status === "connected" && (
              <>
                <DropdownMenuItem onClick={() => onOpen(session.session)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {session.status === "disconnected" && (
              <DropdownMenuItem onClick={() => onConnect(session.session)}>
                <Power className="mr-2 h-4 w-4" />
                Connect
              </DropdownMenuItem>
            )}
            {session.status === "connecting" && (
              <DropdownMenuItem onClick={() => onShowQR(session.session)}>
                <QrCode className="mr-2 h-4 w-4" />
                Show QR Code
              </DropdownMenuItem>
            )}
            {session.status === "connected" && (
              <>
                <DropdownMenuItem onClick={() => onDisconnect(session.session)}>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLogout(session.session)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => onRestart(session.session)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Restart
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(session.session)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            session.status === "connected"
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : session.status === "connecting"
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          }`}
        >
          {statusText}
        </span>

        {session.stats && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{session.stats.messages} msgs</span>
            <span>{session.stats.chats} chats</span>
            <span>{session.stats.contacts} contacts</span>
          </div>
        )}
      </div>
    </div>
  );
}
