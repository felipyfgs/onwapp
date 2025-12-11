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
  ChevronRight,
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

  const handleClick = () => {
    if (onOpen) {
      onOpen(session.session);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${
        onOpen ? "cursor-pointer hover:bg-accent/50" : ""
      }`}
      onClick={handleClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
          {session.session.charAt(0).toUpperCase()}
        </div>
        <div
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColor}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold truncate">{session.session}</h3>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {session.status === "connected" && session.stats
              ? `${session.stats.chats} chats`
              : session.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {session.pushName || session.phone || session.deviceJid || "Not authenticated"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onOpen && (
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
        {onOpen && (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
