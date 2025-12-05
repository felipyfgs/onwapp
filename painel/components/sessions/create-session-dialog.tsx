"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

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
import { createSession } from "@/lib/actions"

interface CreateSessionDialogProps {
  onCreated?: () => void
}

export function CreateSessionDialog({ onCreated }: CreateSessionDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [sessionName, setSessionName] = React.useState("")
  const [apiKey, setApiKey] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sessionName.trim()) {
      toast.error('Nome da sessao e obrigatorio')
      return
    }

    setLoading(true)
    try {
      await createSession({
        session: sessionName.trim(),
        apiKey: apiKey.trim() || undefined,
      })
      toast.success('Sessao criada com sucesso')
      setOpen(false)
      setSessionName("")
      setApiKey("")
      onCreated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar sessao')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sessao
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Sessao</DialogTitle>
            <DialogDescription>
              Crie uma nova sessao do WhatsApp. Voce podera conectar depois.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session-name">Nome da Sessao *</Label>
              <Input
                id="session-name"
                placeholder="minha-sessao"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-key">API Key (opcional)</Label>
              <Input
                id="api-key"
                placeholder="Deixe vazio para gerar automaticamente"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
