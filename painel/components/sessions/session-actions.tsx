"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Play,
  Pause,
  RotateCw,
  Trash2,
  QrCode,
  LogOut,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { connectSession, disconnectSession, restartSession, logoutSession, deleteSession } from "@/lib/actions"
import type { Session } from "@/types"

interface SessionActionsProps {
  session: Session
  onUpdate?: () => void
  onShowQR?: (session: Session) => void
}

export function SessionActions({ session, onUpdate, onShowQR }: SessionActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const result = await connectSession(session.session)
      toast.success(result.message)
      if (result.status === 'connecting') {
        onShowQR?.(session)
      }
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conectar')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      const result = await disconnectSession(session.session)
      toast.success(result.message)
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao desconectar')
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async () => {
    setLoading(true)
    try {
      const result = await restartSession(session.session)
      toast.success(result.message)
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao reiniciar')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      const result = await logoutSession(session.session)
      toast.success(result.message)
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteSession(session.session)
      toast.success('Sessao deletada com sucesso')
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar')
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/session/${session.session}`)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {session.status === 'disconnected' ? (
            <DropdownMenuItem onClick={handleConnect}>
              <Play className="mr-2 h-4 w-4" />
              Conectar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleDisconnect}>
              <Pause className="mr-2 h-4 w-4" />
              Desconectar
            </DropdownMenuItem>
          )}
          {session.status === 'connecting' && (
            <DropdownMenuItem onClick={() => onShowQR?.(session)}>
              <QrCode className="mr-2 h-4 w-4" />
              Ver QR Code
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleRestart}>
            <RotateCw className="mr-2 h-4 w-4" />
            Reiniciar
          </DropdownMenuItem>
          {session.status === 'connected' && (
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A sessao &quot;{session.session}&quot; sera
              permanentemente deletada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
