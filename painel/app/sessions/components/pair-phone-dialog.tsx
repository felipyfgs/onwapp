'use client'

import { useState } from 'react'
import { Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { pairPhone } from '@/lib/actions/sessions'
import { toast } from 'sonner'

interface PairPhoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionName: string
  onSuccess: () => void
}

export function PairPhoneDialog({
  open,
  onOpenChange,
  sessionName,
  onSuccess,
}: PairPhoneDialogProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!phone.trim()) {
      toast.error('Digite o numero de telefone')
      return
    }

    setLoading(true)
    try {
      await pairPhone(sessionName, phone.replace(/\D/g, ''))
      toast.success('Codigo de pareamento enviado!')
      onSuccess()
      onOpenChange(false)
      setPhone('')
    } catch (error) {
      toast.error('Erro ao enviar codigo de pareamento')
      console.error('Pair phone failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Parear por Telefone
          </DialogTitle>
          <DialogDescription>
            Digite o numero de telefone para receber o codigo de pareamento via WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numero de Telefone</Label>
              <Input
                id="phone"
                placeholder="+55 11 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Inclua o codigo do pais (ex: 55 para Brasil)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Enviar Codigo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
