"use client"

import { useState } from "react"
import { Search, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { checkPhones, type CheckPhoneResult } from "@/lib/api/contacts"

interface CheckPhoneDialogProps {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckPhoneDialog({
  sessionId,
  open,
  onOpenChange,
}: CheckPhoneDialogProps) {
  const [input, setInput] = useState("")
  const [results, setResults] = useState<CheckPhoneResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    const phones = input
      .split(/[\n,;]/)
      .map(p => p.trim().replace(/\D/g, ''))
      .filter(p => p.length >= 8)

    if (phones.length === 0) {
      setError('Insira ao menos um numero valido')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const data = await checkPhones(sessionId, phones)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setInput("")
      setResults(null)
      setError(null)
    }
    onOpenChange(open)
  }

  const registered = results?.filter(r => r.isRegistered) || []
  const notRegistered = results?.filter(r => !r.isRegistered) || []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verificar Numeros</DialogTitle>
          <DialogDescription>
            Verifique se numeros estao cadastrados no WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!results ? (
            <>
              <Textarea
                placeholder="Digite os numeros (um por linha ou separados por virgula)&#10;Ex: 5511999999999&#10;5511888888888"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={5}
              />

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button onClick={handleCheck} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Search className="size-4 mr-2" />
                )}
                Verificar
              </Button>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-3">
                {registered.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                      <Check className="size-4" />
                      Cadastrados ({registered.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {registered.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-green-50 dark:bg-green-950 rounded">
                          <span>+{r.phone}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{r.jid}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {notRegistered.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                      <X className="size-4" />
                      Nao cadastrados ({notRegistered.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {notRegistered.map((r, i) => (
                        <div key={i} className="text-sm p-2 bg-red-50 dark:bg-red-950 rounded">
                          +{r.phone}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => setResults(null)} className="w-full">
                Nova Verificacao
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
