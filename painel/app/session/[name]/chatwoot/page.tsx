'use client'

import { use, useEffect, useState, useCallback } from 'react'
import {
  IconLoader2,
  IconCheck,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconDatabase,
  IconCloudUpload,
  IconUsers,
  IconMessage,
  IconChevronRight,
  IconCircleCheck,
} from '@tabler/icons-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import {
  getChatwootConfig,
  setChatwootConfig,
  deleteChatwootConfig,
  syncChatwoot,
  getChatwootSyncStatus,
} from '@/lib/api'
import type { ChatwootConfig, SyncStatus } from '@/lib/types'

const defaultConfig: Partial<ChatwootConfig> = {
  enabled: false,
  url: '',
  token: '',
  account: 0,
  inbox: '',
  signAgent: false,
  signSeparator: '',
  autoReopen: true,
  startPending: false,
  syncContacts: true,
  syncMessages: true,
  syncDays: 30,
  mergeBrPhones: false,
  ignoreChats: [],
  chatwootDbHost: '',
  chatwootDbPort: 5432,
  chatwootDbUser: '',
  chatwootDbPass: '',
  chatwootDbName: '',
}

export default function ChatwootPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({})
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [step, setStep] = useState(1)

  const [config, setConfig] = useState<Partial<ChatwootConfig>>(defaultConfig)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [configData, statusData] = await Promise.all([
        getChatwootConfig(name).catch(() => null),
        getChatwootSyncStatus(name).catch(() => null),
      ])
      if (configData?.url) {
        setConfig({ ...defaultConfig, ...configData })
        if (configData.chatwootDbHost) setStep(3)
        else if (configData.url) setStep(2)
      }
      if (statusData) setSyncStatus(statusData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [name])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (syncStatus?.status !== 'running') return
    const interval = setInterval(async () => {
      const status = await getChatwootSyncStatus(name).catch(() => null)
      if (status) {
        setSyncStatus(status)
        if (status.status !== 'running') setSyncing(null)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [syncStatus?.status, name])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setChatwootConfig(name, { ...config, enabled: true })
      if (step < 3) setStep(step + 1)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await deleteChatwootConfig(name).catch(() => {})
    setConfig(defaultConfig)
    setStep(1)
    setShowDeleteDialog(false)
  }

  const handleSync = async (type: 'all' | 'contacts' | 'messages') => {
    setSyncing(type)
    try {
      const status = await syncChatwoot(name, type, config.syncDays)
      setSyncStatus(status)
    } catch (e) {
      console.error(e)
      setSyncing(null)
    }
  }

  const update = <K extends keyof ChatwootConfig>(key: K, value: ChatwootConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const isStep1Valid = config.url && config.token && config.account
  const isStep2Valid = config.chatwootDbHost && config.chatwootDbUser && config.chatwootDbPass && config.chatwootDbName

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chatwoot</h1>
          <p className="text-muted-foreground text-sm">Integre o WhatsApp com seu helpdesk</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData}>
          <IconRefresh className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => {
          const canNavigate = config.url || s === 1 // Can navigate if has any config or is step 1
          return (
            <button
              key={s}
              onClick={() => canNavigate && setStep(s)}
              disabled={!canNavigate}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : canNavigate
                  ? 'bg-muted hover:bg-accent cursor-pointer'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
            >
              {s < step ? <IconCircleCheck className="h-4 w-4" /> : <span className="w-4 text-center">{s}</span>}
              {s === 1 ? 'Conexao' : s === 2 ? 'Banco' : 'Sync'}
            </button>
          )
        })}
      </div>

      {/* Step 1: Connection */}
      {step === 1 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Conexao com Chatwoot</CardTitle>
            <CardDescription>Configure os dados de acesso a API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>URL *</Label>
                <Input
                  placeholder="https://app.chatwoot.com"
                  value={config.url}
                  onChange={(e) => update('url', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Account ID *</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={config.account || ''}
                  onChange={(e) => update('account', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>API Token *</Label>
              <div className="flex gap-2">
                <Input
                  type={showTokens.token ? 'text' : 'password'}
                  placeholder="Access Token"
                  value={config.token}
                  onChange={(e) => update('token', e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => setShowTokens((p) => ({ ...p, token: !p.token }))}>
                  {showTokens.token ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Inbox (opcional)</Label>
              <Input
                placeholder="Nome ou ID"
                value={config.inbox}
                onChange={(e) => update('inbox', e.target.value)}
              />
            </div>

            <div className="pt-4 space-y-3 border-t">
              <p className="text-sm font-medium">Opcoes</p>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Reabrir conversas resolvidas</Label>
                <Switch checked={config.autoReopen} onCheckedChange={(v) => update('autoReopen', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Assinar com nome do agente</Label>
                <Switch checked={config.signAgent} onCheckedChange={(v) => update('signAgent', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Mesclar telefones BR (9o digito)</Label>
                <Switch checked={config.mergeBrPhones} onCheckedChange={(v) => update('mergeBrPhones', v)} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving || !isStep1Valid}>
                {saving ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuar <IconChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Database */}
      {step === 2 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <IconDatabase className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Banco de Dados</CardTitle>
                <CardDescription>Conexao PostgreSQL para sincronizacao</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Host *</Label>
                <Input
                  placeholder="localhost"
                  value={config.chatwootDbHost}
                  onChange={(e) => update('chatwootDbHost', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Porta</Label>
                <Input
                  type="number"
                  placeholder="5432"
                  value={config.chatwootDbPort || ''}
                  onChange={(e) => update('chatwootDbPort', parseInt(e.target.value) || 5432)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Usuario *</Label>
              <Input
                placeholder="postgres"
                value={config.chatwootDbUser}
                onChange={(e) => update('chatwootDbUser', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <div className="flex gap-2">
                <Input
                  type={showTokens.dbPass ? 'text' : 'password'}
                  placeholder="Senha"
                  value={config.chatwootDbPass}
                  onChange={(e) => update('chatwootDbPass', e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => setShowTokens((p) => ({ ...p, dbPass: !p.dbPass }))}>
                  {showTokens.dbPass ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Banco *</Label>
              <Input
                placeholder="chatwoot_production"
                value={config.chatwootDbName}
                onChange={(e) => update('chatwootDbName', e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={handleSave} disabled={saving || !isStep2Valid}>
                {saving ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuar <IconChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sync */}
      {step === 3 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <IconCloudUpload className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Sincronizacao</CardTitle>
                <CardDescription>Importe contatos e mensagens para o Chatwoot</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            {syncStatus && syncStatus.status !== 'idle' && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {syncStatus.status === 'running' ? (
                      <IconLoader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : syncStatus.status === 'completed' ? (
                      <IconCircleCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <IconCircleCheck className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium">
                      {syncStatus.status === 'running' 
                        ? 'Sincronizando...' 
                        : syncStatus.status === 'completed' 
                        ? 'Ultima sincronizacao' 
                        : 'Falhou'}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {syncStatus.type === 'all' ? 'Completo' : syncStatus.type === 'contacts' ? 'Contatos' : 'Mensagens'}
                  </Badge>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  {(syncStatus.type === 'contacts' || syncStatus.type === 'all') && (
                    <div className="flex items-center gap-3 p-2 rounded bg-background">
                      <IconUsers className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{syncStatus.stats.contactsImported}</p>
                        <p className="text-xs text-muted-foreground">
                          Contatos {syncStatus.stats.contactsErrors > 0 && `(${syncStatus.stats.contactsErrors} erros)`}
                        </p>
                      </div>
                    </div>
                  )}
                  {(syncStatus.type === 'messages' || syncStatus.type === 'all') && (
                    <div className="flex items-center gap-3 p-2 rounded bg-background">
                      <IconMessage className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{syncStatus.stats.messagesImported}</p>
                        <p className="text-xs text-muted-foreground">
                          Mensagens {syncStatus.stats.messagesSkipped > 0 && `(${syncStatus.stats.messagesSkipped} ignoradas)`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {syncStatus.error && (
                  <p className="text-sm text-destructive">{syncStatus.error}</p>
                )}
              </div>
            )}

            {/* Options */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <Label>Dias:</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={config.syncDays || ''}
                  onChange={(e) => update('syncDays', parseInt(e.target.value) || 0)}
                />
                <span className="text-sm text-muted-foreground">0 = todos</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4">
              <Button variant="outline" onClick={() => handleSync('contacts')} disabled={syncing !== null}>
                <IconUsers className="mr-2 h-4 w-4" />
                Contatos
              </Button>
              <Button variant="outline" onClick={() => handleSync('messages')} disabled={syncing !== null}>
                <IconMessage className="mr-2 h-4 w-4" />
                Mensagens
              </Button>
              <Button onClick={() => handleSync('all')} disabled={syncing !== null}>
                {syncing ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconCheck className="mr-2 h-4 w-4" />}
                Sync Completo
              </Button>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <IconTrash className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ignored Chats (collapsible at bottom) */}
      {step === 1 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Chats para ignorar (avancado)
          </summary>
          <div className="mt-2">
            <Textarea
              placeholder="5511999999999@s.whatsapp.net"
              rows={3}
              value={config.ignoreChats?.join('\n') || ''}
              onChange={(e) => update('ignoreChats', e.target.value.split('\n').filter((s) => s.trim()))}
            />
            <p className="text-xs text-muted-foreground mt-1">Um JID por linha</p>
          </div>
        </details>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir configuracao?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao remove a integracao. Dados no Chatwoot nao serao afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
