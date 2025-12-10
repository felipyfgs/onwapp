"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Smartphone, Building2, ChevronRight, Power, Trash2, Loader2 } from "lucide-react"
import { Session, statusConfig } from "./types"
import { cn } from "@/lib/utils"
import { connectSession, disconnectSession, deleteSession } from "@/lib/api"

interface SessionCardProps {
  session: Session
  onUpdate?: () => void
}

function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase()
}

function formatRelativeTime(date?: string): string {
  if (!date) return ""
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (minutes < 1) return "agora"
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

const statusDot = {
  connected: "bg-primary",
  connecting: "bg-muted-foreground",
  disconnected: "bg-destructive",
} as const

export function SessionCard({ session, onUpdate }: SessionCardProps) {
  const config = statusConfig[session.status]
  const lastActivity = session.lastActivityAt || session.lastConnectedAt || session.updatedAt
  const [loading, setLoading] = useState<string | null>(null)

  const handlePower = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const action = session.status === "connected" ? "disconnect" : "connect"
    setLoading(action)
    
    try {
      if (action === "connect") {
        await connectSession(session.session)
      } else {
        await disconnectSession(session.session)
      }
      onUpdate?.()
    } catch (err) {
      console.error(`Error ${action}ing session:`, err)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    setLoading("delete")
    try {
      await deleteSession(session.session)
      onUpdate?.()
    } catch (err) {
      console.error("Error deleting session:", err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <li>
      <Link
        href={`/sessions/${session.session}`}
        className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="relative">
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium text-xs">
            {getInitials(session.session)}
          </div>
          <div className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background", statusDot[session.status])} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-sm text-foreground truncate">{session.session}</span>
              {session.businessName && <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(lastActivity)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {session.pushName && <span>{session.pushName}</span>}
            {session.pushName && session.phone && <span>·</span>}
            {session.phone && <span>{session.phone}</span>}
            {(session.pushName || session.phone) && session.platform && <span>·</span>}
            {session.platform && (
              <span className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                {session.platform}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={cn("text-xs px-1.5 py-0.5 rounded border", config.badgeClass)}>
            {config.label}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-7 w-7",
              session.status === "connected" ? "text-primary" : "text-muted-foreground"
            )}
            onClick={handlePower}
            disabled={loading !== null}
            title={session.status === "connected" ? "Desconectar" : "Conectar"}
          >
            {loading === "connect" || loading === "disconnect" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => e.preventDefault()}
                disabled={loading !== null}
                title="Excluir sessão"
              >
                {loading === "delete" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir sessão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a sessão <strong>{session.session}</strong>? 
                  Esta ação não pode ser desfeita e todos os dados da sessão serão perdidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    </li>
  )
}
