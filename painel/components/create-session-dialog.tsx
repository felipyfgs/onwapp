'use client'

import { useState } from 'react'
import {
  IconPlus,
  IconRefresh,
  IconCopy,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createSession } from '@/lib/api'

interface CreateSessionDialogProps {
  onCreateSession: (name: string, apiKey?: string) => Promise<void>
}

function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'zp.'
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export function CreateSessionDialog({ onCreateSession }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const resetForm = () => {
    setName('')
    setApiKey('')
    setError(null)
    setCopied(false)
  }

  const handleGenerateKey = () => {
    setApiKey(generateApiKey())
  }

  const handleCopyKey = async () => {
    if (!apiKey) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(apiKey)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = apiKey
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome da sessao e obrigatorio')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createSession(name.trim(), apiKey || undefined)
      await onCreateSession(name.trim(), apiKey || undefined)
      setOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sessao')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Nova Sessao
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <TooltipProvider delayDuration={300}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Criar Nova Sessao</DialogTitle>
              <DialogDescription>
                Configure os dados da nova sessao do WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Session Name */}
              <div className="grid gap-2">
                <Label htmlFor="session-name">Nome da Sessao *</Label>
                <Input
                  id="session-name"
                  placeholder="ex: vendas-01"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Apenas letras minusculas, numeros, hifen e underscore
                </p>
              </div>

              {/* API Key */}
              <div className="grid gap-2">
                <Label htmlFor="api-key">API Key (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    placeholder="Deixe vazio para gerar automaticamente"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={loading}
                    className="font-mono text-sm"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateKey}
                        disabled={loading}
                      >
                        <IconRefresh className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Gerar API Key</TooltipContent>
                  </Tooltip>
                  {apiKey && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopyKey}
                          disabled={loading}
                        >
                          {copied ? (
                            <IconCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <IconCopy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copied ? 'Copiado!' : 'Copiar'}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Use para autenticar requisicoes especificas desta sessao
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Sessao'
                )}
              </Button>
            </DialogFooter>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  )
}
