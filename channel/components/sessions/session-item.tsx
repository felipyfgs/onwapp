"use client"

import { useState } from "react"
import {
  Power,
  PowerOff,
  Trash2,
  QrCode,
  MessageSquare,
  Users,
  User,
  Hash,
  Smartphone,
} from "lucide-react"

import { Session } from "@/lib/api/sessions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QRCodeDialog } from "@/components/qr-code-dialog"

interface SessionItemProps {
  session: Session
  onConnect?: (session: Session) => void
  onDisconnect?: (session: Session) => void
  onDelete?: (session: Session) => void
}

function getStatusColor(status: Session["status"]) {
  switch (status) {
    case "connected":
      return "bg-green-500"
    case "connecting":
      return "bg-yellow-500 animate-pulse"
    case "disconnected":
    default:
      return "bg-zinc-500"
  }
}

function getStatusBadgeVariant(status: Session["status"]) {
  switch (status) {
    case "connected":
      return "default" as const
    case "connecting":
      return "secondary" as const
    case "disconnected":
    default:
      return "outline" as const
  }
}

function getInitials(name?: string): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function SessionItem({
  session,
  onConnect,
  onDisconnect,
  onDelete,
}: SessionItemProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const isConnected = session.status === "connected"
  const isConnecting = session.status === "connecting"

  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session.profilePictureUrl} />
            <AvatarFallback className="text-sm">
              {getInitials(session.pushName || session.session)}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${getStatusColor(session.status)}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{session.session}</span>
            <Badge variant={getStatusBadgeVariant(session.status)} className="text-xs">
              {session.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {session.pushName && (
              <span className="truncate">{session.pushName}</span>
            )}
            {session.phone && (
              <span className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                {session.phone}
              </span>
            )}
          </div>
        </div>

        {isConnected && session.stats && (
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {session.stats.messages}
            </span>
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {session.stats.chats}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {session.stats.groups}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {session.stats.contacts}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQrDialogOpen(true)}
            title="QR Code"
          >
            <QrCode className="h-4 w-4" />
          </Button>

          {isConnected ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDisconnect?.(session)}
              title="Disconnect"
            >
              <PowerOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-600"
              onClick={() => onConnect?.(session)}
              disabled={isConnecting}
              title="Connect"
            >
              <Power className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete?.(session)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        sessionId={session.session}
        onConnected={() => setQrDialogOpen(false)}
      />
    </>
  )
}
