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
  MessageSquare,
  Phone,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  const [copiedKey, setCopiedKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const statusConfig = {
    connected: { bg: "bg-green-500/15", text: "text-green-600 dark:text-green-400", dot: "bg-green-500", label: "Online" },
    disconnected: { bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Offline" },
    connecting: { bg: "bg-yellow-500/15", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500", label: "Connecting" },
  }[session.status];

  const handleClick = () => {
    if (onOpen) onOpen(session.session);
  };

  const copyApiKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.apiKey) {
      navigator.clipboard.writeText(session.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const toggleShowApiKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowApiKey(!showApiKey);
  };

  const displayApiKey = (key?: string) => {
    if (!key) return "No API Key";
    if (showApiKey) return key;
    if (key.length <= 8) return "••••••••";
    return `${key.slice(0, 4)}${"•".repeat(8)}${key.slice(-4)}`;
  };

  const borderClass = {
    connected: "border-green-500/50",
    disconnected: "border-gray-200/50",
    connecting: "border-yellow-500/50",
  }[session.status];

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4",
        borderClass,
        onOpen && "cursor-pointer"
      )}
      onClick={handleClick}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(session.session);
        }
      }}
    >
      {/* Header: Avatar + Name + Menu */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-shrink-0">
          {session.profilePicture ? (
            <img
              src={session.profilePicture}
              alt={session.pushName || session.session}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-background"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={cn(
            "h-12 w-12 rounded-full bg-muted flex items-center justify-center text-base font-semibold",
            session.profilePicture ? 'hidden' : ''
          )}>
            {session.session.charAt(0).toUpperCase()}
          </div>
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
            statusConfig.dot
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate leading-tight">
              {session.session}
            </h3>
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              statusConfig.bg,
              statusConfig.text
            )}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {session.pushName || "Not authenticated"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
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
            <DropdownMenuItem onClick={() => onDelete(session.session)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info Section */}
      <div className="space-y-2 mb-3 text-xs text-muted-foreground">
        {session.phone && (
          <div className="flex items-center gap-2 p-1.5 rounded">
            <Phone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/70" />
            <span className="truncate font-medium">{session.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 p-1.5 rounded">
          <Key className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/70" />
          <span className="truncate font-mono text-[11px]">{displayApiKey(session.apiKey)}</span>
          {session.apiKey && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={toggleShowApiKey}
                className="p-1 rounded"
                title={showApiKey ? "Ocultar API Key" : "Mostrar API Key"}
              >
                {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={copyApiKey}
                className="p-1 rounded"
                title="Copiar API Key"
              >
                {copiedKey ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Stats */}
      <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {session.stats ? (
            <>
              <span className="flex items-center gap-1 p-1 rounded">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="font-medium">{session.stats.chats} chats</span>
              </span>
              <span className="p-1 rounded">
                <span className="font-medium">{session.stats.contacts} contacts</span>
              </span>
            </>
          ) : (
            <span className="px-2 py-1 rounded-full bg-muted/50 text-muted-foreground/70 font-medium">
              {session.status}
            </span>
          )}
        </div>
        {onOpen && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        )}
      </div>
    </div>
  );
}
