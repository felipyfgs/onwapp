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
import { Plus } from "lucide-react"

interface CreateSessionDialogProps {
  onCreateSession: (sessionName: string) => Promise<void>
}

export function CreateSessionDialog({ onCreateSession }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionName.trim()) return

    setLoading(true)
    try {
      await onCreateSession(sessionName.trim())
      setSessionName("")
      setOpen(false)
    } catch (error) {
      console.error("Failed to create session:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-create-session>
          <Plus className="h-4 w-4" />
          Nova Sessão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Sessão</DialogTitle>
            <DialogDescription>
              Crie uma nova sessão WhatsApp. Você precisará escanear o QR Code após criar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session">Nome da Sessão</Label>
              <Input
                id="session"
                placeholder="minha-sessao"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading || !sessionName.trim()}>
              {loading ? "Criando..." : "Criar Sessão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
