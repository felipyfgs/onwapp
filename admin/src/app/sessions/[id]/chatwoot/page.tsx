"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChatwoot, useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api-client";

interface ChatwootConfig {
  enabled: boolean;
  url: string;
  token: string;
  account: number;
  inboxId: number;
  inbox?: string;
  signAgent: boolean;
  signSeparator: string;
  autoReopen: boolean;
  startPending: boolean;
  mergeBrPhones: boolean;
  syncContacts: boolean;
  syncMessages: boolean;
  syncDays: number;
  ignoreChats: string[];
  autoCreate: boolean;
}

interface SyncStatus {
  status: string;
  progress?: number;
  message?: string;
  error?: string;
}

interface ChatwootOverview {
  whatsapp: {
    contacts: number;
  };
  chatwoot: {
    contacts: number;
    conversations: number;
    messages: number;
  };
}

export default function ChatwootIntegrationPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const toast = require("sonner").toast;

  const {
    chatwootConfig,
    loading: chatwootLoading,
    error: chatwootError,
    getChatwootConfig,
    setChatwootConfig,
    validateChatwootCredentials,
    syncChatwootContacts,
    syncChatwootMessages,
    syncChatwootAll,
    getChatwootSyncStatus,
    getChatwootOverview,
    resolveAllChatwootConversations,
    getChatwootConversationsStats,
    resetChatwoot,
  } = useChatwoot();

  const [formData, setFormData] = useState<ChatwootConfig>({
    enabled: false,
    url: "",
    token: "",
    account: 0,
    inboxId: 0,
    inbox: "",
    signAgent: false,
    signSeparator: "",
    autoReopen: false,
    startPending: false,
    mergeBrPhones: false,
    syncContacts: false,
    syncMessages: false,
    syncDays: 0,
    ignoreChats: [],
    autoCreate: false,
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [overview, setOverview] = useState<ChatwootOverview | null>(null);
  const [conversationsStats, setConversationsStats] = useState<{ open: number } | null>(null);
  const [isNewConfig, setIsNewConfig] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [activeTab, setActiveTab] = useState("config");
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    inboxes?: { id: number; name: string }[];
  } | null>(null);

  useEffect(() => {
    if (sessionId) {
      getChatwootConfig(sessionId).then((config) => {
        if (config) {
          setFormData(config);
          setIsNewConfig(false);
        }
      });
      fetchSyncStatus();
      fetchOverview();
      fetchConversationsStats();
    }
  }, [sessionId, getChatwootConfig]);

  const fetchSyncStatus = async () => {
    try {
      const status = await getChatwootSyncStatus(sessionId);
      setSyncStatus(status);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar status de sincronização",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar o status de sincronização.",
      });
    }
  };

  const fetchOverview = async () => {
    try {
      const data = await getChatwootOverview(sessionId);
      setOverview(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar visão geral",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar a visão geral.",
      });
    }
  };

  const fetchConversationsStats = async () => {
    try {
      const stats = await getChatwootConversationsStats(sessionId);
      setConversationsStats(stats);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar estatísticas de conversas",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar as estatísticas de conversas.",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.split(",").map((item) => item.trim());
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateCredentials = async () => {
    setValidationLoading(true);
    try {
      const result = await validateChatwootCredentials({
        url: formData.url,
        token: formData.token,
        account: formData.account,
      });
      setValidationResult(result);
      toast({
        title: result.valid ? "Credenciais válidas" : "Credenciais inválidas",
        description: result.message,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao validar credenciais",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao validar as credenciais.",
      });
    } finally {
      setValidationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAction(true);

    try {
      await setChatwootConfig(sessionId, formData);
      toast({
        title: "Configuração salva com sucesso",
        description: "A configuração do Chatwoot foi salva com sucesso.",
      });
      setIsNewConfig(false);
      router.push(`/sessions/${sessionId}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configuração",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao salvar a configuração.",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const startSync = async (type: "contacts" | "messages" | "all") => {
    setIsLoadingAction(true);
    try {
      let response;
      if (type === "contacts") {
        response = await syncChatwootContacts(sessionId, formData.syncDays);
      } else if (type === "messages") {
        response = await syncChatwootMessages(sessionId, formData.syncDays);
      } else {
        response = await syncChatwootAll(sessionId, formData.syncDays);
      }

      toast({
        title: "Sincronização iniciada",
        description: "A sincronização foi iniciada com sucesso.",
      });

      setSyncStatus(response);
      setActiveTab("sync");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao iniciar sincronização",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao iniciar a sincronização.",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const resolveAllConversations = async () => {
    setIsLoadingAction(true);
    try {
      await resolveAllChatwootConversations(sessionId);
      toast({
        title: "Conversas resolvidas",
        description: "Todas as conversas foram resolvidas com sucesso.",
      });
      fetchConversationsStats();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao resolver conversas",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao resolver as conversas.",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleReset = async () => {
    setIsLoadingAction(true);
    try {
      await resetChatwoot(sessionId);
      toast({
        title: "Dados resetados",
        description: "Os dados do Chatwoot foram resetados com sucesso.",
      });
      fetchOverview();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao resetar dados",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao resetar os dados.",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (chatwootLoading && !chatwootConfig) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (chatwootError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{chatwootError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {isNewConfig ? "Configurar Chatwoot" : "Editar Configuração Chatwoot"}
        </h1>
        <Button variant="outline" onClick={() => router.push(`/sessions/${sessionId}`)}>
          Voltar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    name="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label htmlFor="enabled">Ativado</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL do Chatwoot</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://seu-chatwoot.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Token de API</Label>
                  <Input
                    id="token"
                    name="token"
                    type="password"
                    value={formData.token}
                    onChange={handleInputChange}
                    placeholder="Token de API do Chatwoot"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">ID da Conta</Label>
                  <Input
                    id="account"
                    name="account"
                    type="number"
                    value={formData.account}
                    onChange={handleNumberChange}
                    placeholder="ID da conta do Chatwoot"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowValidationDialog(true)}
                  >
                    Validar Credenciais
                  </Button>
                  <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Validar Credenciais</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {validationResult ? (
                          <div className="space-y-2">
                            {validationResult.valid ? (
                              <Alert variant="success">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Credenciais válidas</AlertTitle>
                                <AlertDescription>{validationResult.message}</AlertDescription>
                              </Alert>
                            ) : (
                              <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Credenciais inválidas</AlertTitle>
                                <AlertDescription>{validationResult.message}</AlertDescription>
                              </Alert>
                            )}

                            {validationResult.inboxes && validationResult.inboxes.length > 0 && (
                              <div className="space-y-2">
                                <Label>Inboxes Disponíveis</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {validationResult.inboxes.map((inbox) => (
                                    <Card key={inbox.id} className="p-2">
                                      <div className="font-medium">{inbox.name}</div>
                                      <div className="text-sm text-gray-500">ID: {inbox.id}</div>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500">
                              Clique em "Validar" para verificar as credenciais.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowValidationDialog(false)}
                        >
                          Fechar
                        </Button>
                        <Button
                          onClick={validateCredentials}
                          disabled={validationLoading}
                        >
                          {validationLoading ? "Validando..." : "Validar"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuração de Inbox</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inboxId">ID do Inbox</Label>
                  <Input
                    id="inboxId"
                    name="inboxId"
                    type="number"
                    value={formData.inboxId}
                    onChange={handleNumberChange}
                    placeholder="ID do inbox do Chatwoot"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inbox">Nome do Inbox</Label>
                  <Input
                    id="inbox"
                    name="inbox"
                    type="text"
                    value={formData.inbox || ""}
                    onChange={handleInputChange}
                    placeholder="Nome do inbox do Chatwoot"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoCreate"
                    name="autoCreate"
                    checked={formData.autoCreate}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, autoCreate: checked }))
                    }
                  />
                  <Label htmlFor="autoCreate">Criar automaticamente</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuração Avançada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signSeparator">Separador de Assinatura</Label>
                  <Input
                    id="signSeparator"
                    name="signSeparator"
                    type="text"
                    value={formData.signSeparator}
                    onChange={handleInputChange}
                    placeholder="Separador para assinatura do agente"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="signAgent"
                    name="signAgent"
                    checked={formData.signAgent}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, signAgent: checked }))
                    }
                  />
                  <Label htmlFor="signAgent">Assinar mensagens</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoReopen"
                    name="autoReopen"
                    checked={formData.autoReopen}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, autoReopen: checked }))
                    }
                  />
                  <Label htmlFor="autoReopen">Reabrir automaticamente</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="startPending"
                    name="startPending"
                    checked={formData.startPending}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, startPending: checked }))
                    }
                  />
                  <Label htmlFor="startPending">Começar pendente</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="mergeBrPhones"
                    name="mergeBrPhones"
                    checked={formData.mergeBrPhones}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, mergeBrPhones: checked }))
                    }
                  />
                  <Label htmlFor="mergeBrPhones">Mesclar números BR</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuração de Sincronização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="syncContacts"
                    name="syncContacts"
                    checked={formData.syncContacts}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, syncContacts: checked }))
                    }
                  />
                  <Label htmlFor="syncContacts">Sincronizar contatos</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="syncMessages"
                    name="syncMessages"
                    checked={formData.syncMessages}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, syncMessages: checked }))
                    }
                  />
                  <Label htmlFor="syncMessages">Sincronizar mensagens</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syncDays">Dias para sincronizar</Label>
                  <Input
                    id="syncDays"
                    name="syncDays"
                    type="number"
                    value={formData.syncDays}
                    onChange={handleNumberChange}
                    placeholder="Número de dias para sincronizar (0 para todos)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ignoreChats">Ignorar chats</Label>
                  <Input
                    id="ignoreChats"
                    name="ignoreChats"
                    type="text"
                    value={formData.ignoreChats.join(",")}
                    onChange={(e) => handleArrayChange(e, "ignoreChats")}
                    placeholder="IDs de chats para ignorar (separados por vírgula)"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleReset}
                disabled={isLoadingAction}
              >
                Resetar Dados
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/sessions/${sessionId}`)}
                  disabled={isLoadingAction}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoadingAction}>
                  {isLoadingAction ? "Salvando..." : isNewConfig ? "Salvar Configuração" : "Atualizar Configuração"}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="sync">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status de Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                {syncStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge variant={syncStatus.status === "completed" ? "default" : syncStatus.status === "failed" ? "destructive" : "secondary"}>
                        {syncStatus.status}
                      </Badge>
                    </div>

                    {syncStatus.progress !== undefined && (
                      <div>
                        <Label>Progresso</Label>
                        <Progress value={syncStatus.progress} className="w-full" />
                      </div>
                    )}

                    {syncStatus.message && (
                      <div>
                        <Label>Mensagem</Label>
                        <p className="text-sm text-gray-500">{syncStatus.message}</p>
                      </div>
                    )}

                    {syncStatus.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{syncStatus.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nenhuma sincronização em andamento</AlertTitle>
                    <AlertDescription>
                      Inicie uma sincronização para ver o status.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações de Sincronização</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => startSync("contacts")}
                  disabled={isLoadingAction}
                >
                  Sincronizar Contatos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => startSync("messages")}
                  disabled={isLoadingAction}
                >
                  Sincronizar Mensagens
                </Button>
                <Button
                  onClick={() => startSync("all")}
                  disabled={isLoadingAction}
                >
                  Sincronizar Tudo
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
              </CardHeader>
              <CardContent>
                {overview ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>WhatsApp</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <Label>Contatos</Label>
                            <p className="text-2xl font-bold">{overview.whatsapp.contacts}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Chatwoot</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <Label>Contatos</Label>
                            <p className="text-2xl font-bold">{overview.chatwoot.contacts}</p>
                          </div>
                          <div>
                            <Label>Conversas</Label>
                            <p className="text-2xl font-bold">{overview.chatwoot.conversations}</p>
                          </div>
                          <div>
                            <Label>Mensagens</Label>
                            <p className="text-2xl font-bold">{overview.chatwoot.messages}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Skeleton className="h-48" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Conversas</CardTitle>
              </CardHeader>
              <CardContent>
                {conversationsStats ? (
                  <div className="flex items-center gap-4">
                    <div>
                      <Label>Conversas Abertas</Label>
                      <p className="text-2xl font-bold">{conversationsStats.open}</p>
                    </div>
                    <Button
                      onClick={resolveAllConversations}
                      disabled={isLoadingAction}
                    >
                      Resolver Todas
                    </Button>
                  </div>
                ) : (
                  <Skeleton className="h-16" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}