"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Loader2 } from "lucide-react"
import { createSession } from "@/lib/api"

interface CreateSessionDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function CreateSessionDialog({ trigger, onSuccess }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    session: "",
    syncHistory: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await createSession({
        session: formData.session,
        syncHistory: formData.syncHistory,
      })
      
      setOpen(false)
      setFormData({ session: "", syncHistory: false })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar sessão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar nova sessão</DialogTitle>
            <DialogDescription>
              Crie uma nova sessão do WhatsApp. O nome deve ser único.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session">Nome da sessão *</Label>
              <Input
                id="session"
                placeholder="minha-sessao"
                value={formData.session}
                onChange={(e) => setFormData(prev => ({ ...prev, session: e.target.value }))}
                pattern="^[a-zA-Z0-9_-]+$"
                title="Apenas letras, números, - e _"
                required
              />
              <p className="text-xs text-muted-foreground">
                Identificador único da sessão (apenas letras, números, - e _)
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="syncHistory">Sincronizar histórico</Label>
                <p className="text-xs text-muted-foreground">
                  Sincronizar mensagens antigas ao conectar
                </p>
              </div>
              <Switch
                id="syncHistory"
                checked={formData.syncHistory}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, syncHistory: checked }))}
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.session}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar sessão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
