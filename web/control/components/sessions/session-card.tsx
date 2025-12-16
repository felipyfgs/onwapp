"use client"

import Link from "next/link"
import {
  MoreHorizontal,
  Power,
  PowerOff,
  Settings,
  Trash2,
  Smartphone,
} from "lucide-react"

import { Session } from "@/lib/api/sessions"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function SessionCard({
  session,
  onConnect,
  onDisconnect,
  onDelete,
}: SessionCardProps) {
  const isConnected = session.status === "connected"
  const isConnecting = session.status === "connecting"

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
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
            <div className="space-y-1">
              <CardTitle className="text-base">{session.session}</CardTitle>
              {session.pushName && (
                <CardDescription>{session.pushName}</CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/sessions/${session.session}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isConnected ? (
                <DropdownMenuItem onClick={() => onDisconnect?.(session)}>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => onConnect?.(session)}
                  disabled={isConnecting}
                >
                  <Power className="mr-2 h-4 w-4" />
                  Connect
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(session)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
        {session.about && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {session.about}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/sessions/${session.session}`}>
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Link>
          </Button>
          {isConnected ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => onDisconnect?.(session)}
            >
              <PowerOff className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onConnect?.(session)}
              disabled={isConnecting}
            >
              <Power className="mr-2 h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
