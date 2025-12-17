"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Power,
  PowerOff,
  Settings,
  Trash2,
  Smartphone,
  QrCode,
  MessageSquare,
  Users,
  User,
  Hash,
} from "lucide-react"

import { Session, SessionStats } from "@/lib/api/sessions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { QRCodeDialog } from "@/components/qr-code-dialog"

interface SessionCardProps {
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
      return "bg-yellow-500"
    case "disconnected":
    default:
      return "bg-red-500"
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
      return "destructive" as const
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

function StatsBadge({ icon: Icon, label, value }: { icon: any, label: string, value: number }) {
  if (value === 0) return null
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
      <Icon className="h-3 w-3" />
      <span className="font-medium">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

export function SessionCard({
  session,
  onConnect,
  onDisconnect,
  onDelete,
}: SessionCardProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const isConnected = session.status === "connected"
  const isConnecting = session.status === "connecting"

  const handleConnect = async () => {
    await onConnect?.(session)
  }

  return (
    <>
      <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={session.profilePictureUrl} />
                <AvatarFallback>
                  {getInitials(session.pushName || session.session)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(session.status)}`}
              />
            </div>
            <div className="space-y-1 flex-1">
              <CardTitle className="text-base">{session.session}</CardTitle>
              {session.pushName && (
                <CardDescription>{session.pushName}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Stats Row */}
          {isConnected && session.stats && (
            <div className="flex flex-wrap gap-2">
              <StatsBadge icon={MessageSquare} label="msgs" value={session.stats.messages} />
              <StatsBadge icon={Hash} label="chats" value={session.stats.chats} />
              <StatsBadge icon={Users} label="grps" value={session.stats.groups} />
              <StatsBadge icon={User} label="cntcts" value={session.stats.contacts} />
            </div>
          )}

          {/* Status & Phone Row */}
          <div className="flex items-center justify-between">
            <Badge variant={getStatusBadgeVariant(session.status)}>
              {session.status}
            </Badge>
            {session.phone && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Smartphone className="h-3 w-3" />
                {session.phone}
              </span>
            )}
          </div>

          {/* All Action Buttons */}
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/sessions/${session.session}`}>
                <Settings className="mr-2 h-4 w-4" />
                Config
              </Link>
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setQrDialogOpen(true)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR
            </Button>

            {isConnected ? (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onDisconnect?.(session)}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Disc
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                <Power className="mr-2 h-4 w-4" />
                {isConnecting ? "Conn..." : "Connect"}
              </Button>
            )}
          </div>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => onDelete?.(session)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Session
          </Button>
        </CardContent>
      </Card>

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        sessionId={session.session}
        onConnected={() => {
          setQrDialogOpen(false)
          // Trigger parent refresh if needed
        }}
      />
    </>
  )
}
