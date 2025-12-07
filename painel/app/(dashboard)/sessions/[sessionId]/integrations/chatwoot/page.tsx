"use client"

import { useState, useEffect, use } from "react"
import { Loader2, Save, Trash2, MessageSquare, RefreshCw, CheckCircle } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  getChatwootConfig, 
  setChatwootConfig, 
  deleteChatwootConfig,
  syncChatwoot,
  getSyncStatus,
  resolveAllConversations,
  type ChatwootConfig,
  type SyncStatus,
} from "@/lib/api/chatwoot"

export default function ChatwootPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [config, setConfig] = useState<ChatwootConfig | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    enabled: false,
    url: "",
    token: "",
    account: 0,
    inboxId: 0,
    signAgent: true,
    autoReopen: true,
    startPending: false,
    syncContacts: true,
    syncMessages: true,
    syncDays: 7,
    chatwootDbHost: "",
    chatwootDbPort: 5432,
    chatwootDbUser: "",
    chatwootDbPass: "",
    chatwootDbName: "",
  })

  useEffect(() => {
    async function load() {
      try {
        const [configData, statusData] = await Promise.all([
          getChatwootConfig(sessionId).catch(() => null),
          getSyncStatus(sessionId).catch(() => null),
        ])
        
        if (configData) {
          setConfig(configData)
          setFormData({
            enabled: configData.enabled,
            url: configData.url || "",
            token: configData.token || "",
            account: configData.account || 0,
            inboxId: configData.inboxId || 0,
            signAgent: configData.signAgent ?? true,
            autoReopen: configData.autoReopen ?? true,
            startPending: configData.startPending ?? false,
            syncContacts: configData.syncContacts ?? true,
            syncMessages: configData.syncMessages ?? true,
            syncDays: configData.syncDays || 7,
            chatwootDbHost: configData.chatwootDbHost || "",
            chatwootDbPort: configData.chatwootDbPort || 5432,
            chatwootDbUser: configData.chatwootDbUser || "",
            chatwootDbPass: configData.chatwootDbPass || "",
            chatwootDbName: configData.chatwootDbName || "",
          })
        }
        
        if (statusData) {
          setSyncStatus(statusData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  useEffect(() => {
    if (syncStatus?.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const status = await getSyncStatus(sessionId)
          setSyncStatus(status)
          if (status.status !== 'running') {
            setSyncing(false)
          }
        } catch {
          // ignore
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [syncStatus?.status, sessionId])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const data = await setChatwootConfig(sessionId, formData)
      setConfig(data)
      setSuccess('Configuracao salva com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Deseja remover a configuracao do Chatwoot?')) return
    
    setSaving(true)
    setError(null)
    
    try {
      await deleteChatwootConfig(sessionId)
      setConfig(null)
      setFormData({
        enabled: false,
        url: "",
        token: "",
        account: 0,
        inboxId: 0,
        signAgent: true,
        autoReopen: true,
        startPending: false,
        syncContacts: true,
        syncMessages: true,
        syncDays: 7,
        chatwootDbHost: "",
        chatwootDbPort: 5432,
        chatwootDbUser: "",
        chatwootDbPass: "",
        chatwootDbName: "",
      })
      setSuccess('Configuracao removida!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover')
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (type: 'all' | 'contacts' | 'messages') => {
    setSyncing(true)
    setError(null)
    
    try {
      const status = await syncChatwoot(sessionId, type, formData.syncDays)
      setSyncStatus(status)
      setSuccess(`Sincronizacao de ${type} iniciada!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar')
      setSyncing(false)
    }
  }

  const handleResolveAll = async () => {
    if (!confirm('Deseja resolver todas as conversas abertas?')) return
    
    try {
      const result = await resolveAllConversations(sessionId)
      setSuccess(`${result.resolved} conversas resolvidas!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resolver')
    }
  }

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessoes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}/integrations`}>Integracoes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Chatwoot</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="size-6" />
            Chatwoot
          </h1>
          <p className="text-muted-foreground">
            Integre com o Chatwoot para atendimento ao cliente
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Configuracao Basica</CardTitle>
              <CardDescription>
                Credenciais de acesso ao Chatwoot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => updateField('enabled', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="enabled" className="text-sm font-medium">
                  Integracao habilitada
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL do Chatwoot</label>
                <Input
                  placeholder="https://app.chatwoot.com"
                  value={formData.url}
                  onChange={(e) => updateField('url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Token</label>
                <Input
                  type="password"
                  placeholder="Token de acesso"
                  value={formData.token}
                  onChange={(e) => updateField('token', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account ID</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={formData.account || ""}
                    onChange={(e) => updateField('account', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inbox ID</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={formData.inboxId || ""}
                    onChange={(e) => updateField('inboxId', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opcoes</CardTitle>
              <CardDescription>
                Comportamento da integracao
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="signAgent"
                    checked={formData.signAgent}
                    onChange={(e) => updateField('signAgent', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="signAgent" className="text-sm">
                    Assinar mensagens com nome do agente
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoReopen"
                    checked={formData.autoReopen}
                    onChange={(e) => updateField('autoReopen', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoReopen" className="text-sm">
                    Reabrir conversa ao receber mensagem
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="startPending"
                    checked={formData.startPending}
                    onChange={(e) => updateField('startPending', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="startPending" className="text-sm">
                    Iniciar conversas como pendente
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="syncContacts"
                    checked={formData.syncContacts}
                    onChange={(e) => updateField('syncContacts', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="syncContacts" className="text-sm">
                    Sincronizar contatos
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="syncMessages"
                    checked={formData.syncMessages}
                    onChange={(e) => updateField('syncMessages', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="syncMessages" className="text-sm">
                    Sincronizar mensagens
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dias para sincronizar</label>
                <Input
                  type="number"
                  placeholder="7"
                  value={formData.syncDays}
                  onChange={(e) => updateField('syncDays', parseInt(e.target.value) || 7)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banco de Dados (Sync Direto)</CardTitle>
              <CardDescription>
                Conexao direta com o banco do Chatwoot (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Host</label>
                  <Input
                    placeholder="localhost"
                    value={formData.chatwootDbHost}
                    onChange={(e) => updateField('chatwootDbHost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Porta</label>
                  <Input
                    type="number"
                    placeholder="5432"
                    value={formData.chatwootDbPort}
                    onChange={(e) => updateField('chatwootDbPort', parseInt(e.target.value) || 5432)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Usuario</label>
                <Input
                  placeholder="postgres"
                  value={formData.chatwootDbUser}
                  onChange={(e) => updateField('chatwootDbUser', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  placeholder="Senha do banco"
                  value={formData.chatwootDbPass}
                  onChange={(e) => updateField('chatwootDbPass', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Database</label>
                <Input
                  placeholder="chatwoot_production"
                  value={formData.chatwootDbName}
                  onChange={(e) => updateField('chatwootDbName', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sincronizacao</CardTitle>
              <CardDescription>
                {syncStatus?.status === 'running' 
                  ? `Sincronizando... ${syncStatus.progress || 0}/${syncStatus.total || 0}`
                  : 'Sincronizar dados com o Chatwoot'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncStatus?.status === 'running' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Sincronizando {syncStatus.type}...</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${syncStatus.total ? (syncStatus.progress || 0) / syncStatus.total * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSync('all')}
                    disabled={syncing || !formData.enabled || !formData.chatwootDbHost}
                  >
                    <RefreshCw className="size-4 mr-2" />
                    Sync Completo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSync('contacts')}
                    disabled={syncing || !formData.enabled || !formData.chatwootDbHost}
                  >
                    Sync Contatos
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSync('messages')}
                    disabled={syncing || !formData.enabled || !formData.chatwootDbHost}
                  >
                    Sync Mensagens
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleResolveAll}
                    disabled={syncing || !formData.enabled}
                  >
                    <CheckCircle className="size-4 mr-2" />
                    Resolver Todas
                  </Button>
                </div>
              )}

              {!formData.chatwootDbHost && (
                <p className="text-xs text-muted-foreground">
                  Configure o banco de dados para habilitar sincronizacao
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Salvar
          </Button>

          {config && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              <Trash2 className="size-4 mr-2" />
              Remover
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
