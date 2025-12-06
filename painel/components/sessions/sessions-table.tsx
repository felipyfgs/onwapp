"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Power, PowerOff, Trash2, QrCode, LogOut, RefreshCw } from "lucide-react"
import type { Session } from "@/lib/types/session"
import { QRCodeDialog } from "./qr-code-dialog"

interface SessionsTableProps {
  sessions: Session[]
  onConnect: (session: string) => void
  onDisconnect: (session: string) => void
  onLogout: (session: string) => void
  onRestart: (session: string) => void
  onDelete: (session: string) => void
}

export function SessionsTable({
  sessions,
  onConnect,
  onDisconnect,
  onLogout,
  onRestart,
  onDelete,
}: SessionsTableProps) {
  const [qrSession, setQrSession] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500">Conectada</Badge>
      case "connecting":
        return <Badge className="bg-yellow-500">Conectando</Badge>
      case "disconnected":
        return <Badge variant="destructive">Desconectada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhuma sessão encontrada</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={session.profilePicture} />
                <AvatarFallback>
                  {session.pushName?.substring(0, 2).toUpperCase() || session.session.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{session.session}</p>
                  {getStatusBadge(session.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.pushName || session.phone || "Não conectada"}
                </p>
                {session.stats && (
                  <p className="text-xs text-muted-foreground">
                    {session.stats.messages} msgs • {session.stats.chats} chats • {session.stats.contacts} contatos
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {session.status === "disconnected" && (
                  <>
                    <DropdownMenuItem onClick={() => onConnect(session.session)}>
                      <Power className="mr-2 h-4 w-4" />
                      Conectar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setQrSession(session.session)}>
                      <QrCode className="mr-2 h-4 w-4" />
                      Ver QR Code
                    </DropdownMenuItem>
                  </>
                )}
                
                {session.status === "connected" && (
                  <>
                    <DropdownMenuItem onClick={() => onDisconnect(session.session)}>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Desconectar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRestart(session.session)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reiniciar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLogout(session.session)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </>
                )}

                {session.status === "connecting" && (
                  <DropdownMenuItem onClick={() => setQrSession(session.session)}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Ver QR Code
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(session.session)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <QRCodeDialog
        session={qrSession}
        open={!!qrSession}
        onClose={() => setQrSession(null)}
      />
    </>
  )
}
