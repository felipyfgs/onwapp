"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Loader2,
  MessageSquare,
  Play,
  RefreshCcw,
  Save,
  Settings,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Zap,
  Globe,
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
import { Separator } from "@/components/ui/separator"
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

import type { ChatwootConfig, SyncStatus } from "@/lib/types/chatwoot"
import {
  getChatwootConfig,
  setChatwootConfig,
  deleteChatwootConfig,
  syncAll,
  getSyncStatus,
} from "@/lib/api/chatwoot"

interface ChatwootWizardProps {
  sessionId: string
}

type WizardStep = 1 | 2 | 3 | 4

export function ChatwootWizard({ sessionId }: ChatwootWizardProps) {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState<WizardStep>(1)
  const [config, setConfigData] = React.useState<ChatwootConfig | null>(null)
  const [syncStatus, setSyncStatusData] = React.useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = React.useState(false)

  // Form state
  const [enabled, setEnabled] = React.useState(false)
  const [url, setUrl] = React.useState("")
  const [token, setToken] = React.useState("")
  const [account, setAccount] = React.useState("")
  const [inboxId, setInboxId] = React.useState("")
  const [inbox, setInbox] = React.useState("")
  const [signAgent, setSignAgent] = React.useState(false)
  const [signSeparator, setSignSeparator] = React.useState("")
  const [autoReopen, setAutoReopen] = React.useState(true)
  const [startPending, setStartPending] = React.useState(false)
  const [mergeBrPhones, setMergeBrPhones] = React.useState(true)
  const [syncContactsEnabled, setSyncContactsEnabled] = React.useState(false)
  const [syncMessagesEnabled, setSyncMessagesEnabled] = React.useState(false)
  const [syncDays, setSyncDays] = React.useState("")
  const [autoCreate, setAutoCreate] = React.useState(true)
  
  // Sync options
  const [ignoreChats, setIgnoreChats] = React.useState("")
  
  // Auto-create inbox options
  const [number, setNumber] = React.useState("")
  const [organization, setOrganization] = React.useState("")
  const [logo, setLogo] = React.useState("")
  
  // Database config
  const [chatwootDbHost, setChatwootDbHost] = React.useState("")
  const [chatwootDbPort, setChatwootDbPort] = React.useState("")
  const [chatwootDbUser, setChatwootDbUser] = React.useState("")
  const [chatwootDbPass, setChatwootDbPass] = React.useState("")
  const [chatwootDbName, setChatwootDbName] = React.useState("")

  const loadData = React.useCallback(async () => {
    try {
      const [configData, statusData] = await Promise.all([
        getChatwootConfig(sessionId).catch(() => null),
        getSyncStatus(sessionId).catch(() => null),
      ])

      setConfigData(configData)
      setSyncStatusData(statusData)

      // Populate form if config exists
      if (configData) {
        setEnabled(configData.enabled)
        setUrl(configData.url || "")
        setToken(configData.token || "")
        setAccount(configData.account?.toString() || "")
        setInboxId(configData.inboxId?.toString() || "")
        setInbox(configData.inbox || "")
        setSignAgent(configData.signAgent)
        setSignSeparator(configData.signSeparator || "")
        setAutoReopen(configData.autoReopen)
        setStartPending(configData.startPending)
        setMergeBrPhones(configData.mergeBrPhones)
        setSyncContactsEnabled(configData.syncContacts)
        setSyncMessagesEnabled(configData.syncMessages)
        setSyncDays(configData.syncDays?.toString() || "")
        setAutoCreate(configData.autoCreate)
        setIgnoreChats(configData.ignoreChats?.join("\n") || "")
        setNumber((configData as any).number || "")
        setOrganization((configData as any).organization || "")
        setLogo((configData as any).logo || "")
        setChatwootDbHost(configData.chatwootDbHost || "")
        setChatwootDbPort(configData.chatwootDbPort?.toString() || "")
        setChatwootDbUser(configData.chatwootDbUser || "")
        setChatwootDbPass(configData.chatwootDbPass || "")
        setChatwootDbName(configData.chatwootDbName || "")
        
        // Se a configuração já está salva e habilitada, vai direto para o step 4 (Sincronização)
        if (configData.enabled && configData.url && configData.token && configData.account) {
          setCurrentStep(4)
        }
      }
    } catch (error) {
      console.error("Failed to load chatwoot config:", error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Poll sync status while running
  React.useEffect(() => {
    if (syncStatus?.status === "running") {
      const interval = setInterval(async () => {
        try {
          const status = await getSyncStatus(sessionId)
          setSyncStatusData(status)
          if (status.status !== "running") {
            clearInterval(interval)
            setSyncing(false)
            loadData()
          }
        } catch (error) {
          console.error("Failed to poll sync status:", error)
          clearInterval(interval)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [syncStatus?.status, sessionId, loadData])

  const validateStep = (step: WizardStep): boolean => {
    switch (step) {
      case 1:
        return !!(url && token && account)
      case 2:
        return true // Optional settings
      case 3:
        return true // Optional database config
      case 4:
        return true // Review step
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as WizardStep)
      }
    } else {
      toast.error("Por favor, preencha todos os campos obrigatórios")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
    }
  }

  const handleSave = async () => {
    // Validate required fields
    if (!url || !url.trim()) {
      toast.error("URL do Chatwoot é obrigatória")
      setCurrentStep(1)
      return
    }
    if (!token || !token.trim()) {
      toast.error("Token de acesso é obrigatório")
      setCurrentStep(1)
      return
    }
    if (!account || isNaN(parseInt(account))) {
      toast.error("ID da conta é obrigatório e deve ser um número")
      setCurrentStep(1)
      return
    }

    setSaving(true)
    try {
      // Build request object according to backend expectations
      const requestData: any = {
        enabled: true,
        url: url.trim(),
        token: token.trim(),
        account: parseInt(account),
        signAgent: signAgent || false,
        autoReopen: autoReopen !== undefined ? autoReopen : true,
        startPending: startPending || false,
        mergeBrPhones: mergeBrPhones !== undefined ? mergeBrPhones : true,
        syncContacts: syncContactsEnabled || false,
        syncMessages: syncMessagesEnabled || false,
        autoCreate: autoCreate !== undefined ? autoCreate : true,
      }

      // Add optional fields only if they have values
      if (inboxId && inboxId.trim()) {
        const inboxIdNum = parseInt(inboxId)
        if (!isNaN(inboxIdNum)) {
          requestData.inboxId = inboxIdNum
        }
      }
      if (inbox && inbox.trim()) {
        requestData.inbox = inbox.trim()
      }
      if (signSeparator && signSeparator.trim()) {
        requestData.signSeparator = signSeparator.trim()
      }
      if (syncDays && syncDays.trim()) {
        const syncDaysNum = parseInt(syncDays)
        if (!isNaN(syncDaysNum)) {
          requestData.syncDays = syncDaysNum
        }
      }
      if (ignoreChats && ignoreChats.trim()) {
        requestData.ignoreChats = ignoreChats.split("\n").map(s => s.trim()).filter(s => s.length > 0)
      }
      if (number && number.trim()) {
        requestData.number = number.trim()
      }
      if (organization && organization.trim()) {
        requestData.organization = organization.trim()
      }
      if (logo && logo.trim()) {
        requestData.logo = logo.trim()
      }
      if (chatwootDbHost && chatwootDbHost.trim()) {
        requestData.chatwootDbHost = chatwootDbHost.trim()
      }
      if (chatwootDbPort && chatwootDbPort.trim()) {
        const portNum = parseInt(chatwootDbPort)
        if (!isNaN(portNum)) {
          requestData.chatwootDbPort = portNum
        }
      }
      if (chatwootDbUser && chatwootDbUser.trim()) {
        requestData.chatwootDbUser = chatwootDbUser.trim()
      }
      if (chatwootDbPass && chatwootDbPass.trim()) {
        requestData.chatwootDbPass = chatwootDbPass.trim()
      }
      if (chatwootDbName && chatwootDbName.trim()) {
        requestData.chatwootDbName = chatwootDbName.trim()
      }

      console.log("Sending config:", requestData)

      await setChatwootConfig(sessionId, requestData)

      toast.success("Configuração salva com sucesso!")
      await loadData()
      // Auto-advance to step 4 if on step 3
      if (currentStep === 3) {
        setCurrentStep(4)
      }
    } catch (error: any) {
      console.error("Error saving config:", error)
      const errorMessage = error.message || "Erro ao salvar configuração"
      toast.error(errorMessage)
      // If validation error, go back to step 1
      if (errorMessage.includes("required") || errorMessage.includes("obrigatório")) {
        setCurrentStep(1)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSyncAll = async () => {
    // Validate database config is present
    if (!chatwootDbHost || !chatwootDbHost.trim()) {
      toast.error("Configuração do banco de dados é necessária para sincronização. Configure no passo 3.")
      setCurrentStep(3)
      return
    }

    // First save the configuration if not already saved or if config changed
    if (!config?.enabled || !config?.url || !config?.token) {
      try {
        await handleSave()
        // Wait a bit for the config to be saved and reloaded
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await loadData()
      } catch (error) {
        toast.error("Erro ao salvar configuração antes de sincronizar")
        return
      }
    }

    // Double check config is enabled after save
    const currentConfig = await getChatwootConfig(sessionId).catch(() => null)
    if (!currentConfig?.enabled) {
      toast.error("A configuração precisa estar habilitada para sincronizar")
      return
    }

    if (!currentConfig.chatwootDbHost) {
      toast.error("Configuração do banco de dados é necessária para sincronização")
      setCurrentStep(3)
      return
    }

    setSyncing(true)
    try {
      const days = syncDays && syncDays.trim() ? parseInt(syncDays) : undefined
      console.log("Starting sync with days:", days)
      const status = await syncAll(sessionId, days)
      setSyncStatusData(status)
      toast.success("Sincronização iniciada! Acompanhe o progresso abaixo.")
    } catch (error: any) {
      console.error("Sync error:", error)
      const errorMessage = error.message || "Erro ao iniciar sincronização"
      toast.error(errorMessage)
      
      // If error mentions database, go to step 3
      if (errorMessage.toLowerCase().includes("database") || 
          errorMessage.toLowerCase().includes("banco") ||
          errorMessage.toLowerCase().includes("chatwootdbhost")) {
        setCurrentStep(3)
      }
      setSyncing(false)
    }
  }

  const steps = [
    { number: 1, title: "Básico", icon: Settings },
    { number: 2, title: "Avançado", icon: Zap },
    { number: 3, title: "Banco", icon: Database },
    { number: 4, title: "Sincronizar", icon: RefreshCcw },
  ]

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
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Assistente de Configuração</CardTitle>
          </div>
          {config?.enabled && (
            <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configurado
            </Badge>
          )}
        </div>
        <CardDescription>
          Siga os passos abaixo para configurar a integração com o Chatwoot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps - Enhanced visual indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIconComponent = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            const isPending = currentStep < step.number

            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : isCompleted
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-muted text-muted-foreground border-muted"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIconComponent className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive
                        ? "text-foreground"
                        : isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      isCompleted ? "bg-emerald-500" : "bg-muted"
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="space-y-4">
          {/* Step 1: Basic Configuration */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Configuração Básica</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL do Chatwoot *</Label>
                <Input
                  id="url"
                  placeholder="https://app.chatwoot.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL base da sua instalação do Chatwoot
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Token de acesso da API do Chatwoot
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                    placeholder="1"
                    value={inboxId}
                    onChange={(e) => setInboxId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional - deixe vazio para usar inbox padrão
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Advanced Settings */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoReopen">Reabrir Conversas Automaticamente</Label>
                    <p className="text-xs text-muted-foreground">
                      Reabre conversas automaticamente quando recebe mensagens
                    </p>
                  </div>
                  <Switch
                    id="autoReopen"
                    checked={autoReopen}
                    onCheckedChange={setAutoReopen}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="startPending">Iniciar como Pendente</Label>
                    <p className="text-xs text-muted-foreground">
                      Novas conversas começam com status pendente
                    </p>
                  </div>
                  <Switch
                    id="startPending"
                    checked={startPending}
                    onCheckedChange={setStartPending}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="mergeBrPhones">Mesclar Telefones BR</Label>
                    <p className="text-xs text-muted-foreground">
                      Normaliza números de telefone brasileiros
                    </p>
                  </div>
                  <Switch
                    id="mergeBrPhones"
                    checked={mergeBrPhones}
                    onCheckedChange={setMergeBrPhones}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="signAgent">Assinar Mensagens</Label>
                    <p className="text-xs text-muted-foreground">
                      Adiciona assinatura do agente nas mensagens
                    </p>
                  </div>
                  <Switch
                    id="signAgent"
                    checked={signAgent}
                    onCheckedChange={setSignAgent}
                  />
                </div>

                {signAgent && (
                  <div className="space-y-2 p-3 rounded-lg border bg-muted/50">
                    <Label htmlFor="signSeparator">Separador</Label>
                    <Input
                      id="signSeparator"
                      placeholder="\n"
                      value={signSeparator}
                      onChange={(e) => setSignSeparator(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Caractere usado para separar a mensagem da assinatura
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoCreate">Criar Inbox Automaticamente</Label>
                    <p className="text-xs text-muted-foreground">
                      Cria inbox automaticamente se não existir
                    </p>
                  </div>
                  <Switch
                    id="autoCreate"
                    checked={autoCreate}
                    onCheckedChange={setAutoCreate}
                  />
                </div>

                {autoCreate && (
                  <div className="space-y-4 p-3 rounded-lg border bg-muted/50">
                    <p className="text-xs text-muted-foreground font-medium">Dados para criação da Inbox:</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="number">Número do WhatsApp</Label>
                        <Input
                          id="number"
                          placeholder="+5511999999999"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organization">Organização</Label>
                        <Input
                          id="organization"
                          placeholder="Nome da empresa"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo">URL do Logo</Label>
                      <Input
                        id="logo"
                        placeholder="https://exemplo.com/logo.png"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="syncContacts">Sincronizar Contatos</Label>
                    <p className="text-xs text-muted-foreground">
                      Importa contatos do WhatsApp para o Chatwoot
                    </p>
                  </div>
                  <Switch
                    id="syncContacts"
                    checked={syncContactsEnabled}
                    onCheckedChange={setSyncContactsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="syncMessages">Sincronizar Mensagens</Label>
                    <p className="text-xs text-muted-foreground">
                      Importa mensagens do WhatsApp para o Chatwoot
                    </p>
                  </div>
                  <Switch
                    id="syncMessages"
                    checked={syncMessagesEnabled}
                    onCheckedChange={setSyncMessagesEnabled}
                  />
                </div>

                <div className="space-y-2 p-3 rounded-lg border">
                  <Label htmlFor="syncDays">Dias para Importar</Label>
                  <Input
                    id="syncDays"
                    type="number"
                    placeholder="30"
                    value={syncDays}
                    onChange={(e) => setSyncDays(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de dias de histórico para importar (padrão: 30)
                  </p>
                </div>

                <div className="space-y-2 p-3 rounded-lg border">
                  <Label htmlFor="ignoreChats">Chats a Ignorar</Label>
                  <Textarea
                    id="ignoreChats"
                    placeholder="5511999999999@s.whatsapp.net&#10;5511888888888@s.whatsapp.net"
                    value={ignoreChats}
                    onChange={(e) => setIgnoreChats(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    JIDs dos chats a ignorar na sincronização (um por linha)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Database Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Configuração do Banco de Dados</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure o acesso ao banco de dados do Chatwoot para sincronização de dados históricos
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dbHost">Host</Label>
                  <Input
                    id="dbHost"
                    placeholder="localhost"
                    value={chatwootDbHost}
                    onChange={(e) => setChatwootDbHost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dbPort">Porta</Label>
                  <Input
                    id="dbPort"
                    type="number"
                    placeholder="5432"
                    value={chatwootDbPort}
                    onChange={(e) => setChatwootDbPort(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dbUser">Usuário</Label>
                <Input
                  id="dbUser"
                  placeholder="chatwoot"
                  value={chatwootDbUser}
                  onChange={(e) => setChatwootDbUser(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dbPass">Senha</Label>
                <Input
                  id="dbPass"
                  type="password"
                  placeholder="••••••••"
                  value={chatwootDbPass}
                  onChange={(e) => setChatwootDbPass(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dbName">Nome do Banco</Label>
                <Input
                  id="dbName"
                  placeholder="chatwoot_production"
                  value={chatwootDbName}
                  onChange={(e) => setChatwootDbName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review and Sync */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Revisão e Sincronização</h3>
              </div>
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumo da Configuração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conexao */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conexão</p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs truncate">{url || "-"}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>Conta: <span className="font-semibold text-foreground">{account || "-"}</span></span>
                          <span>Inbox: <span className="font-semibold text-foreground">{inboxId || inbox || "Auto"}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opcoes */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opções</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="text-muted-foreground text-xs">Auto Reabrir</span>
                        <Badge variant={autoReopen ? "default" : "secondary"} className="text-xs">
                          {autoReopen ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="text-muted-foreground text-xs">Iniciar Pendente</span>
                        <Badge variant={startPending ? "default" : "secondary"} className="text-xs">
                          {startPending ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="text-muted-foreground text-xs">Mesclar BR</span>
                        <Badge variant={mergeBrPhones ? "default" : "secondary"} className="text-xs">
                          {mergeBrPhones ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="text-muted-foreground text-xs">Assinar Msgs</span>
                        <Badge variant={signAgent ? "default" : "secondary"} className="text-xs">
                          {signAgent ? "Sim" : "Não"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Sincronizacao */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sincronização</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="text-muted-foreground text-xs">Sync Contatos</span>
                        <Badge variant={syncContactsEnabled ? "default" : "secondary"} className="text-xs">
                          {syncContactsEnabled ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="text-muted-foreground text-xs">Sync Mensagens</span>
                        <Badge variant={syncMessagesEnabled ? "default" : "secondary"} className="text-xs">
                          {syncMessagesEnabled ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="text-muted-foreground text-xs">Dias p/ Importar</span>
                        <span className="font-semibold text-xs">{syncDays || "30"}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-background">
                        <span className="text-muted-foreground text-xs">Banco de Dados</span>
                        <Badge variant={chatwootDbHost ? "default" : "outline"} className="text-xs">
                          {chatwootDbHost ? "OK" : "Não"}
                        </Badge>
                      </div>
                    </div>
                    {ignoreChats && (
                      <div className="p-2 rounded-md bg-background text-xs">
                        <span className="text-muted-foreground">Chats ignorados: </span>
                        <span className="font-mono">{ignoreChats.split("\n").filter(s => s.trim()).length}</span>
                      </div>
                    )}
                  </div>

                  {/* Banco de Dados - detalhes */}
                  {chatwootDbHost && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Banco de Dados</p>
                      <div className="p-2 rounded-md bg-background text-xs font-mono">
                        {chatwootDbUser}@{chatwootDbHost}:{chatwootDbPort || "5432"}/{chatwootDbName}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sync Status */}
              {syncStatus && syncStatus.status === "running" && (
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold">Sincronização em andamento...</span>
                    </div>
                    <Progress value={undefined} className="h-2 mb-3" />
                    {syncStatus.stats && (
                      <div className="grid gap-2 text-sm md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Contatos:</span>
                          <span className="font-semibold">{syncStatus.stats.contactsImported}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Mensagens:</span>
                          <span className="font-semibold">{syncStatus.stats.messagesImported}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Conversas:</span>
                          <span className="font-semibold">{syncStatus.stats.conversationsUsed}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {syncStatus && syncStatus.status === "completed" && (
                <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        Sincronização concluída com sucesso!
                      </span>
                    </div>
                    {syncStatus.stats && (
                      <div className="grid gap-2 text-sm md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Contatos:</span>
                          <span className="font-semibold">{syncStatus.stats.contactsImported}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Mensagens:</span>
                          <span className="font-semibold">{syncStatus.stats.messagesImported}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Conversas:</span>
                          <span className="font-semibold">{syncStatus.stats.conversationsUsed}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </div>

        {/* Navigation Buttons */}
        <Separator />
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configuração
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSyncAll}
                  disabled={syncing || syncStatus?.status === "running" || !chatwootDbHost}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {syncing || syncStatus?.status === "running" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Sincronizar
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

