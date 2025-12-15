"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSessions, useWebhooks, useChatwoot } from "@/hooks/use-api";
import { useNats, useNatsEvent } from "@/hooks/use-nats";
import { SESSION_STATUS, NATS_EVENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    fetchSessions,
    getSessionStatus,
    connectSession,
    disconnectSession,
    logoutSession,
    restartSession,
    deleteSession,
  } = useSessions();

  const {
    webhook,
    loading: webhookLoading,
    error: webhookError,
    getWebhook,
    setWebhook,
    updateWebhook,
    deleteWebhook,
  } = useWebhooks();

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

  const { isConnected, events } = useNats();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<string>(SESSION_STATUS.DISCONNECTED);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (sessionId) {
      fetchSessions();
      getWebhook(sessionId);
      getChatwootConfig(sessionId);
    }
  }, [sessionId, fetchSessions, getWebhook, getChatwootConfig]);

  useEffect(() => {
    if (sessions && sessionId) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
        setStatus(session.status);
      }
    }
  }, [sessions, sessionId]);

  useNatsEvent("SESSION_CONNECTED", (event) => {
    if (event.sessionId === sessionId) {
      setStatus(SESSION_STATUS.CONNECTED);
    }
  });

  useNatsEvent("SESSION_DISCONNECTED", (event) => {
    if (event.sessionId === sessionId) {
      setStatus(SESSION_STATUS.DISCONNECTED);
    }
  });

  useNatsEvent("SESSION_QR", (event) => {
    if (event.sessionId === sessionId) {
      setStatus(SESSION_STATUS.QR);
    }
  });

  useNatsEvent("SESSION_LOGGED_OUT", (event) => {
    if (event.sessionId === sessionId) {
      setStatus(SESSION_STATUS.DISCONNECTED);
    }
  });

  const handleConnect = async () => {
    setIsLoadingAction(true);
    try {
      await connectSession(sessionId);
    } catch (err) {
      console.error("Failed to connect session:", err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoadingAction(true);
    try {
      await disconnectSession(sessionId);
    } catch (err) {
      console.error("Failed to disconnect session:", err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleLogout = async () => {
    setIsLoadingAction(true);
    try {
      await logoutSession(sessionId);
    } catch (err) {
      console.error("Failed to logout session:", err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleRestart = async () => {
    setIsLoadingAction(true);
    try {
      await restartSession(sessionId);
    } catch (err) {
      console.error("Failed to restart session:", err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    setIsLoadingAction(true);
    try {
      await deleteSession(sessionId);
      router.push("/sessions");
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case SESSION_STATUS.CONNECTED:
        return <Badge variant="default">Conectado</Badge>;
      case SESSION_STATUS.CONNECTING:
        return <Badge variant="secondary">Conectando</Badge>;
      case SESSION_STATUS.QR:
        return <Badge variant="secondary">QR Code</Badge>;
      case SESSION_STATUS.ERROR:
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  if (sessionsLoading || !currentSession) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (sessionsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{sessionsError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{currentSession.session}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            {getStatusBadge(status)}
          </div>
        </div>
        <div className="flex gap-2">
          {status === SESSION_STATUS.DISCONNECTED ? (
            <Button onClick={handleConnect} disabled={isLoadingAction}>
              Conectar
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isLoadingAction}
              >
                Desconectar
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoadingAction}
              >
                Logout
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            onClick={handleRestart}
            disabled={isLoadingAction}
          >
            Reiniciar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoadingAction}
          >
            Excluir
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="device">Dispositivo</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="chatwoot">Chatwoot</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID da Sessão</p>
                  <p className="font-medium">{currentSession.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">API Key</p>
                  <p className="font-medium">{currentSession.apiKey}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Criado em</p>
                  <p className="font-medium">
                    {new Date(currentSession.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Atualizado em</p>
                  <p className="font-medium">
                    {new Date(currentSession.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logs de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {events
                  .filter((event) => event.sessionId === sessionId)
                  .map((event, index) => (
                    <div key={index} className="mb-2 p-2 border rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{event.event}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{event.status}</p>
                    </div>
                  ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="device" className="space-y-4">
          {currentSession.device ? (
            <Card>
              <CardHeader>
                <CardTitle>Dispositivo Conectado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentSession.device.pushName}`}
                    />
                    <AvatarFallback>
                      {currentSession.device.pushName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">
                      {currentSession.device.pushName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Plataforma: {currentSession.device.platform}
                    </p>
                    <p className="text-sm text-gray-500">
                      JID: {currentSession.device.jid}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nenhum dispositivo conectado</AlertTitle>
              <AlertDescription>
                Esta sessão não tem nenhum dispositivo conectado no momento.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {currentSession.stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mensagens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {currentSession.stats.messages}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Chats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {currentSession.stats.chats}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Contatos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {currentSession.stats.contacts}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Grupos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {currentSession.stats.groups}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Estatísticas não disponíveis</AlertTitle>
              <AlertDescription>
                As estatísticas ainda não estão disponíveis para esta sessão.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              {webhookLoading ? (
                <Skeleton className="h-48" />
              ) : webhookError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{webhookError}</AlertDescription>
                </Alert>
              ) : webhook ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">URL</p>
                    <p className="font-medium">{webhook.url || "Não configurado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Eventos</p>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.length > 0 ? (
                        webhook.events.map((event, index) => (
                          <Badge key={index} variant="secondary">
                            {event}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">
                          Nenhum evento selecionado
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    {webhook.enabled ? (
                      <Badge variant="default">Ativado</Badge>
                    ) : (
                      <Badge variant="secondary">Desativado</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/sessions/${sessionId}/webhooks`)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await deleteWebhook(sessionId);
                        } catch (err) {
                          console.error("Failed to delete webhook:", err);
                        }
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">Webhook não configurado</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Esta sessão não tem um webhook configurado.
                  </p>
                  <Button
                    onClick={() => router.push(`/sessions/${sessionId}/webhooks`)}
                  >
                    Configurar Webhook
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatwoot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integração Chatwoot</CardTitle>
            </CardHeader>
            <CardContent>
              {chatwootLoading ? (
                <Skeleton className="h-48" />
              ) : chatwootError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{chatwootError}</AlertDescription>
                </Alert>
              ) : chatwootConfig ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    {chatwootConfig.enabled ? (
                      <Badge variant="default">Ativado</Badge>
                    ) : (
                      <Badge variant="secondary">Desativado</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">URL</p>
                    <p className="font-medium">
                      {chatwootConfig.url || "Não configurado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Conta</p>
                    <p className="font-medium">{chatwootConfig.account}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inbox</p>
                    <p className="font-medium">{chatwootConfig.inbox}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(`/sessions/${sessionId}/chatwoot`)
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await resetChatwoot(sessionId);
                        } catch (err) {
                          console.error("Failed to reset Chatwoot:", err);
                        }
                      }}
                    >
                      Resetar Dados
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">
                    Chatwoot não configurado
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Esta sessão não tem integração com Chatwoot configurada.
                  </p>
                  <Button
                    onClick={() =>
                      router.push(`/sessions/${sessionId}/chatwoot`)
                    }
                  >
                    Configurar Chatwoot
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Tipos de dados
interface Session {
  id: string;
  session: string;
  status: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
  device?: {
    platform: string;
    pushName: string;
    jid: string;
  };
  stats?: {
    messages: number;
    chats: number;
    contacts: number;
    groups: number;
  };
}
