'use client'

import { useState } from 'react'
import { IconTrash, IconLoader2, IconAlertTriangle } from '@tabler/icons-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteSessionDialogProps {
  sessionName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => Promise<void>
}

export function DeleteSessionDialog({
  sessionName,
  open,
  onOpenChange,
  onConfirm,
}: DeleteSessionDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!sessionName) return
    setLoading(true)
    try {
      await onConfirm(sessionName)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <IconAlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Excluir Sessao</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2" asChild>
            <div className="text-muted-foreground text-sm">
              Tem certeza que deseja excluir a sessao <code className="rounded bg-muted px-1.5 py-0.5 font-semibold">{sessionName}</code>?
              <p className="mt-3">Esta acao ira:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Desconectar o WhatsApp</li>
                <li>Remover todas as credenciais</li>
                <li>Excluir os dados da sessao</li>
              </ul>
              <p className="mt-3 text-destructive font-medium">Esta acao nao pode ser desfeita.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <IconTrash className="mr-2 h-4 w-4" />
                Excluir Sessao
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
