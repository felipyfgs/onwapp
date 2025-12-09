"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Copy, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getContactQRLink } from "@/lib/api/contacts"

interface QRLinkDialogProps {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRLinkDialog({
  sessionId,
  open,
  onOpenChange,
}: QRLinkDialogProps) {
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLink = useCallback(async (revoke: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getContactQRLink(sessionId, revoke)
      setLink(data.link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter link')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (open && !link) {
      loadLink(false)
    }
  }, [open, link, loadLink])

  const handleCopy = async () => {
    if (!link) return
    setCopying(true)
    await navigator.clipboard.writeText(link)
    setTimeout(() => setCopying(false), 1500)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setLink(null)
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Meu Link de Contato</DialogTitle>
          <DialogDescription>
            Compartilhe este link para que outros possam adicionar voce
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm text-destructive mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={() => loadLink(false)}>
                Tentar novamente
              </Button>
            </div>
          ) : link ? (
            <>
              <div className="p-3 bg-muted rounded-lg break-all text-sm font-mono">
                {link}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopy} className="flex-1">
                  {copying ? (
                    <Check className="size-4 mr-2" />
                  ) : (
                    <Copy className="size-4 mr-2" />
                  )}
                  {copying ? 'Copiado!' : 'Copiar Link'}
                </Button>
                <Button variant="outline" onClick={() => loadLink(true)} disabled={loading}>
                  <RefreshCw className="size-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Clique em renovar para gerar um novo link (invalida o anterior)
              </p>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
