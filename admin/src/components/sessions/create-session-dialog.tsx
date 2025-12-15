"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface CreateSessionDialogProps {
  onSessionCreated?: () => void
  children?: React.ReactNode
}

export const CreateSessionDialog = ({ onSessionCreated, children }: CreateSessionDialogProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const api = useApi()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sessionName.trim()) {
      toast.error("Nome da sessão é obrigatório")
      return
    }

    setLoading(true)
    try {
      await createSession(sessionName.trim())
      toast.success("Sessão criada com sucesso!")
      setSessionName("")
      setOpen(false)
      onSessionCreated?.()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar sessão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Sessão
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Sessão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Nome da Sessão</Label>
            <Input
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Digite o nome da sessão"
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Sessão"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}