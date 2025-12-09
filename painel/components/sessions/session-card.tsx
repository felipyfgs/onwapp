"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Smartphone, 
  MoreVertical,
  QrCode,
  Power,
  Trash2,
  ChevronRight,
  Clock,
  MessageSquare,
} from "lucide-react"
import { Session, statusConfig } from "./types"

interface SessionCardProps {
  session: Session
  isLast: boolean
}

export function SessionCard({ session, isLast }: SessionCardProps) {
  const config = statusConfig[session.status]

  const handleQuickAction = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const renderQuickAction = () => {
    switch (session.status) {
      case "qr_pending":
        return (
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
            onClick={handleQuickAction}
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Escanear QR</span>
          </Button>
        )
      case "disconnected":
        return (
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
            onClick={handleQuickAction}
          >
            <Power className="h-4 w-4" />
            <span className="hidden sm:inline">Conectar</span>
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <Link
      href={`/sessions/${session.id}`}
      className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/50 ${
        !isLast ? "border-b" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div 
            className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${config.color}`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{session.name}</span>
            <Badge className={config.badgeClass}>
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {session.phone || session.id}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{session.lastActivity}</span>
          </div>
          {session.messagesCount > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>{session.messagesCount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {renderQuickAction()}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {session.status === "qr_pending" && (
              <DropdownMenuItem>
                <QrCode className="mr-2 h-4 w-4" />
                Escanear QR
              </DropdownMenuItem>
            )}
            {session.status === "disconnected" && (
              <DropdownMenuItem>
                <Power className="mr-2 h-4 w-4" />
                Conectar
              </DropdownMenuItem>
            )}
            {session.status === "connected" && (
              <DropdownMenuItem>
                <Power className="mr-2 h-4 w-4" />
                Desconectar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
      </div>
    </Link>
  )
}
