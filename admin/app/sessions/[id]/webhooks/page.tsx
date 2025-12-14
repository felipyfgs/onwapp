"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common";
import { getWebhook, setWebhook, deleteWebhook, Webhook } from "@/lib/api";
import { Webhook as WebhookIcon, Plus, Trash2, RefreshCw, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default function WebhooksPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [webhook, setWebhookState] = useState<Webhook | null>(null);
  const [loading, setLoading] = useState(true);
  const [configDialog, setConfigDialog] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchWebhook = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await getWebhook(sessionId);
      setWebhookState(data);
      if (data) {
        setWebhookUrl(data.url);
      }
    } catch (error) {
      console.error("Failed to fetch webhook:", error);
      setWebhookState(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchWebhook();
  }, [fetchWebhook]);

  const handleSaveWebhook = async () => {
    if (!webhookUrl || !sessionId) return;
    setSaving(true);
    try {
      const result = await setWebhook(sessionId, { url: webhookUrl, enabled: true });
      setWebhookState(result);
      setConfigDialog(false);
    } catch (error) {
      console.error("Failed to save webhook:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!sessionId || !confirm("Excluir este webhook?")) return;
    try {
      await deleteWebhook(sessionId);
      setWebhookState(null);
      setWebhookUrl("");
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  const allEvents = [
    "message.received",
    "message.sent",
    "message.receipt",
    "message.reaction",
    "session.connected",
    "session.disconnected",
    "session.qr",
    "presence.update",
    "group.update",
    "contact.update",
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader
          breadcrumbs={[
            { label: "Sessions", href: "/sessions" },
            { label: sessionId, href: `/sessions/${sessionId}` },
            { label: "Webhooks" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Toolbar */}
          <div className="flex gap-4">
            <Button variant="outline" size="sm" onClick={fetchWebhook}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>

          {/* Webhook Card */}
          {loading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ) : webhook ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <WebhookIcon className="h-5 w-5" />
                      Configuração do Webhook
                    </CardTitle>
                    <CardDescription>Eventos serão enviados para esta URL</CardDescription>
                  </div>
                  <Badge variant={webhook.enabled !== false ? "default" : "secondary"}>
                    {webhook.enabled !== false ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Desativado
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-sm truncate">{webhook.url}</code>
                  <a href={webhook.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Eventos</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(webhook.events || allEvents).map((event) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Dialog open={configDialog} onOpenChange={setConfigDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Editar Webhook</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configurar Webhook</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>URL do Webhook</Label>
                          <Input
                            placeholder="https://seu-servidor.com/webhook"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleSaveWebhook} disabled={saving || !webhookUrl} className="w-full">
                          {saving ? "Salvando..." : "Salvar Webhook"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" onClick={handleDeleteWebhook}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhum Webhook Configurado</CardTitle>
                <CardDescription>Configure um webhook para receber eventos em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={configDialog} onOpenChange={setConfigDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurar Webhook</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>URL do Webhook</Label>
                        <Input
                          placeholder="https://seu-servidor.com/webhook"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleSaveWebhook} disabled={saving || !webhookUrl} className="w-full">
                        {saving ? "Salvando..." : "Salvar Webhook"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* Events Info */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos Disponíveis</CardTitle>
              <CardDescription>Eventos que serão enviados ao seu webhook</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {allEvents.map((event) => (
                  <div key={event} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Badge variant="outline" className="font-mono text-xs">
                      {event}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
