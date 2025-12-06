"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Globe,
  Loader2,
  RefreshCcw,
  Save,
  Settings,
  Trash2,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type { ChatwootConfig, SetChatwootConfigRequest, SyncStatus } from "@/lib/types/chatwoot"
import {
  getChatwootConfig,
  setChatwootConfig,
  deleteChatwootConfig,
  syncAll,
  getSyncStatus,
  resolveAllConversations,
} from "@/lib/api/chatwoot"

interface ChatwootConfigProps {
  sessionId: string
}

export function ChatwootConfiguration({ sessionId }: ChatwootConfigProps) {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [config, setConfig] = React.useState<ChatwootConfig | null>(null)
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = React.useState(false)
  const [resolving, setResolving] = React.useState(false)
  const [warnings, setWarnings] = React.useState<string[]>([])

  // Connection form
  const [url, setUrl] = React.useState("")
  const [token, setToken] = React.useState("")
  const [account, setAccount] = React.useState("")
  const [inboxId, setInboxId] = React.useState("")

  // Options form
  const [autoReopen, setAutoReopen] = React.useState(true)
  const [startPending, setStartPending] = React.useState(false)
  const [mergeBrPhones, setMergeBrPhones] = React.useState(true)
  const [signAgent, setSignAgent] = React.useState(false)
  const [signSeparator, setSignSeparator] = React.useState("")
  const [autoCreate, setAutoCreate] = React.useState(true)
  const [syncContacts, setSyncContacts] = React.useState(false)
  const [syncMessages, setSyncMessages] = React.useState(false)
  const [syncDays, setSyncDays] = React.useState("")
  const [ignoreChats, setIgnoreChats] = React.useState("")

  // Database form
  const [dbHost, setDbHost] = React.useState("")
  const [dbPort, setDbPort] = React.useState("")
  const [dbUser, setDbUser] = React.useState("")
  const [dbPass, setDbPass] = React.useState("")
  const [dbName, setDbName] = React.useState("")

  const loadData = React.useCallback(async () => {
    try {
      const [configData, statusData] = await Promise.all([
        getChatwootConfig(sessionId).catch(() => null),
        getSyncStatus(sessionId).catch(() => null),
      ])

      setConfig(configData)
      setSyncStatus(statusData)

      if (configData) {
        setUrl(configData.url || "")
        setToken(configData.token || "")
        setAccount(configData.account?.toString() || "")
        setInboxId(configData.inboxId?.toString() || "")
        setAutoReopen(configData.autoReopen)
        setStartPending(configData.startPending)
        setMergeBrPhones(configData.mergeBrPhones)
        setSignAgent(configData.signAgent)
        setSignSeparator(configData.signSeparator || "")
        setAutoCreate(configData.autoCreate)
        setSyncContacts(configData.syncContacts)
        setSyncMessages(configData.syncMessages)
        setSyncDays(configData.syncDays?.toString() || "")
        setIgnoreChats(configData.ignoreChats?.join("\n") || "")
        setDbHost(configData.chatwootDbHost || "")
        setDbPort(configData.chatwootDbPort?.toString() || "")
        setDbUser(configData.chatwootDbUser || "")
        setDbPass(configData.chatwootDbPass || "")
        setDbName(configData.chatwootDbName || "")
      }
    } catch (error) {
      console.error("Failed to load config:", error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  React.useEffect(() => {
    if (syncStatus?.status === "running") {
      const interval = setInterval(async () => {
        try {
          const status = await getSyncStatus(sessionId)
          setSyncStatus(status)
          if (status.status !== "running") {
            clearInterval(interval)
            setSyncing(false)
            loadData()
          }
        } catch {
          clearInterval(interval)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [syncStatus?.status, sessionId, loadData])

  const handleSave = async () => {
    if (!url.trim()) {
      toast.error("URL do Chatwoot é obrigatória")
      return
    }
    if (!token.trim()) {
      toast.error("Token de acesso é obrigatório")
      return
    }
    if (!account || isNaN(parseInt(account))) {
      toast.error("ID da conta é obrigatório")
      return
    }

    setSaving(true)
    try {
      const data: SetChatwootConfigRequest = {
        enabled: true,
        url: url.trim(),
        token: token.trim(),
        account: parseInt(account),
        autoReopen,
        startPending,
        mergeBrPhones,
        signAgent,
        autoCreate,
        syncContacts,
        syncMessages,
        inboxId: inboxId.trim() ? parseInt(inboxId) : undefined,
        signSeparator: signSeparator.trim() || undefined,
        syncDays: syncDays.trim() ? parseInt(syncDays) : undefined,
        ignoreChats: ignoreChats.trim() ? ignoreChats.split("\n").map(s => s.trim()).filter(Boolean) : undefined,
        chatwootDbHost: dbHost.trim() || undefined,
        chatwootDbPort: dbPort.trim() ? parseInt(dbPort) : undefined,
        chatwootDbUser: dbUser.trim() || undefined,
        chatwootDbPass: dbPass.trim() || undefined,
        chatwootDbName: dbName.trim() || undefined,
      }

      const result = await setChatwootConfig(sessionId, data)
      
      // Check for warnings in response
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
        result.warnings.forEach((w: string) => toast.warning(w))
      } else {
        setWarnings([])
        toast.success("Configuração salva!")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    if (!dbHost.trim()) {
      toast.error("Configure o banco de dados para sincronizar")
      return
    }

    setSyncing(true)
    try {
      const days = syncDays.trim() ? parseInt(syncDays) : undefined
      const status = await syncAll(sessionId, days)
      setSyncStatus(status)
      toast.success("Sincronização iniciada!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao sincronizar")
      setSyncing(false)
    }
  }

  const handleResolveAll = async () => {
    setResolving(true)
    try {
      const result = await resolveAllConversations(sessionId)
      toast.success(`${result.resolved} conversas resolvidas!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao resolver conversas")
    } finally {
      setResolving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteChatwootConfig(sessionId)
      toast.success("Configuração removida")
      setConfig(null)
      setUrl("")
      setToken("")
      setAccount("")
      setInboxId("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Warnings Alert */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Atenção</p>
              {warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-700 dark:text-amber-300">{w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Badge */}
      {config?.enabled && (
        <div className="flex items-center justify-between">
          <Badge variant="default" className={warnings.length > 0 ? "bg-amber-600" : "bg-emerald-600"}>
            {warnings.length > 0 ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            {warnings.length > 0 ? "Integração com Problemas" : "Integração Ativa"}
          </Badge>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover integração?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá desativar a integração com o Chatwoot. Você poderá configurar novamente depois.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Conexão</span>
          </TabsTrigger>
          <TabsTrigger value="options" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Opções</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Sincronização</span>
          </TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Conexão com Chatwoot
              </CardTitle>
              <CardDescription>
                Configure os dados de acesso à API do Chatwoot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL do Chatwoot *</Label>
                <Input
                  id="url"
                  placeholder="https://app.chatwoot.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token de Acesso *</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Token da API"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account">ID da Conta *</Label>
                  <Input
                    id="account"
                    type="number"
                    placeholder="1"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inboxId">ID da Inbox</Label>
                  <Input
                    id="inboxId"
                    type="number"
                    placeholder="Auto"
                    value={inboxId}
                    onChange={(e) => setInboxId(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Conexão
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Opções de Comportamento
              </CardTitle>
              <CardDescription>
                Configure como a integração deve funcionar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Reabrir Conversas</Label>
                    <p className="text-xs text-muted-foreground">Reabre ao receber mensagens</p>
                  </div>
                  <Switch checked={autoReopen} onCheckedChange={setAutoReopen} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Iniciar Pendente</Label>
                    <p className="text-xs text-muted-foreground">Novas conversas como pendentes</p>
                  </div>
                  <Switch checked={startPending} onCheckedChange={setStartPending} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Normalizar Telefones BR</Label>
                    <p className="text-xs text-muted-foreground">Padroniza números brasileiros</p>
                  </div>
                  <Switch checked={mergeBrPhones} onCheckedChange={setMergeBrPhones} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Assinar Mensagens</Label>
                    <p className="text-xs text-muted-foreground">Adiciona nome do agente</p>
                  </div>
                  <Switch checked={signAgent} onCheckedChange={setSignAgent} />
                </div>

                {signAgent && (
                  <div className="pl-4 space-y-2">
                    <Label htmlFor="signSeparator">Separador da Assinatura</Label>
                    <Input
                      id="signSeparator"
                      placeholder="\n"
                      value={signSeparator}
                      onChange={(e) => setSignSeparator(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Criar Inbox Automático</Label>
                    <p className="text-xs text-muted-foreground">Cria se não existir</p>
                  </div>
                  <Switch checked={autoCreate} onCheckedChange={setAutoCreate} />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Opções
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Banco de Dados do Chatwoot
                </CardTitle>
                <CardDescription>
                  Necessário para sincronização de histórico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dbHost">Host</Label>
                    <Input
                      id="dbHost"
                      placeholder="localhost"
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dbPort">Porta</Label>
                    <Input
                      id="dbPort"
                      type="number"
                      placeholder="5432"
                      value={dbPort}
                      onChange={(e) => setDbPort(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbUser">Usuário</Label>
                  <Input
                    id="dbUser"
                    placeholder="chatwoot"
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbPass">Senha</Label>
                  <Input
                    id="dbPass"
                    type="password"
                    placeholder="••••••••"
                    value={dbPass}
                    onChange={(e) => setDbPass(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbName">Nome do Banco</Label>
                  <Input
                    id="dbName"
                    placeholder="chatwoot_production"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving} variant="outline" className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Configuração do Banco
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5" />
                  Sincronização
                </CardTitle>
                <CardDescription>
                  Importe contatos e mensagens do WhatsApp para o Chatwoot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label>Sincronizar Contatos</Label>
                      <p className="text-xs text-muted-foreground">Importa contatos salvos</p>
                    </div>
                    <Switch checked={syncContacts} onCheckedChange={setSyncContacts} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <Label>Sincronizar Mensagens</Label>
                      <p className="text-xs text-muted-foreground">Importa histórico de mensagens</p>
                    </div>
                    <Switch checked={syncMessages} onCheckedChange={setSyncMessages} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syncDays">Dias para Importar</Label>
                  <Input
                    id="syncDays"
                    type="number"
                    placeholder="30 (padrão: todos)"
                    value={syncDays}
                    onChange={(e) => setSyncDays(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ignoreChats">Chats a Ignorar</Label>
                  <Textarea
                    id="ignoreChats"
                    placeholder="5511999999999@s.whatsapp.net (um por linha)"
                    value={ignoreChats}
                    onChange={(e) => setIgnoreChats(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Sync Status */}
                {syncStatus && syncStatus.status === "running" && (
                  <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Sincronizando...</span>
                    </div>
                    <Progress value={undefined} className="h-2" />
                    {syncStatus.stats && (
                      <div className="mt-2 text-xs text-muted-foreground grid grid-cols-3 gap-2">
                        <span>Contatos: {syncStatus.stats.contactsImported}</span>
                        <span>Mensagens: {syncStatus.stats.messagesImported}</span>
                        <span>Conversas: {syncStatus.stats.conversationsUsed}</span>
                      </div>
                    )}
                  </div>
                )}

                {syncStatus && syncStatus.status === "completed" && (
                  <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Sincronização concluída!
                      </span>
                    </div>
                    {syncStatus.stats && (
                      <div className="mt-2 text-xs text-muted-foreground grid grid-cols-3 gap-2">
                        <span>Contatos: {syncStatus.stats.contactsImported}</span>
                        <span>Mensagens: {syncStatus.stats.messagesImported}</span>
                        <span>Conversas: {syncStatus.stats.conversationsUsed}</span>
                      </div>
                    )}
                  </div>
                )}

                {syncStatus && syncStatus.status === "failed" && (
                  <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                    <span className="text-sm text-red-600">{syncStatus.error || "Erro na sincronização"}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSync}
                    disabled={syncing || syncStatus?.status === "running" || !dbHost.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {syncing || syncStatus?.status === "running" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4" />
                        Sincronizar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleResolveAll}
                    disabled={resolving || !config?.enabled}
                    variant="outline"
                  >
                    {resolving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Resolver Todas
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
