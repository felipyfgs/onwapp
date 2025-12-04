'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { createSession, connectSession, getSessionQRData } from '@/lib/api'

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

type Step = 'form' | 'qrcode'

export function CreateSessionDialog({ onCreateSession }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // QR Code state
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrStatus, setQrStatus] = useState<string>('')
  const [polling, setPolling] = useState(false)

  const resetForm = () => {
    setStep('form')
    setName('')
    setApiKey('')
    setError(null)
    setCopied(false)
    setQrCode(null)
    setQrStatus('')
    setPolling(false)
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

  const pollQRCode = useCallback(async (sessionName: string) => {
    if (!polling) return
    
    try {
      const data = await getSessionQRData(sessionName)
      setQrStatus(data.status)
      
      if (data.status === 'connected') {
        setPolling(false)
        setQrCode(null)
        // Close dialog and refresh
        setTimeout(() => {
          setOpen(false)
          resetForm()
        }, 1500)
        return
      }
      
      if (data.qr) {
        setQrCode(data.qr)
      }
      
      // Continue polling
      setTimeout(() => pollQRCode(sessionName), 2000)
    } catch {
      // Continue polling even on error
      setTimeout(() => pollQRCode(sessionName), 3000)
    }
  }, [polling])

  useEffect(() => {
    if (step === 'qrcode' && name && polling) {
      pollQRCode(name)
    }
  }, [step, name, polling, pollQRCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome da sessao e obrigatorio')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create session
      await createSession(name.trim(), apiKey || undefined)
      
      // Connect session to generate QR
      await connectSession(name.trim())
      
      // Move to QR code step
      setStep('qrcode')
      setPolling(true)
      
      // Notify parent
      await onCreateSession(name.trim(), apiKey || undefined)
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
          {step === 'form' ? (
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
                    'Criar e Conectar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Escanear QR Code</DialogTitle>
                <DialogDescription>
                  Abra o WhatsApp no celular e escaneie o QR Code abaixo.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-6">
                {qrStatus === 'connected' ? (
                  <div className="flex flex-col items-center gap-3 text-green-600">
                    <IconCheck className="h-16 w-16" />
                    <p className="text-lg font-medium">Conectado com sucesso!</p>
                  </div>
                ) : qrCode ? (
                  <div className="relative">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-64 h-64 rounded-lg border"
                    />
                    {polling && (
                      <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1">
                        <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <IconLoader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Sessao: <code className="bg-muted px-2 py-0.5 rounded">{name}</code>
                  </p>
                  {qrStatus && qrStatus !== 'connected' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {qrStatus}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPolling(false)
                    setOpen(false)
                    resetForm()
                  }}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  )
}
