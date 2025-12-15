"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWebhooks } from "@/hooks/use-api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WebhookConfigPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { toast } = useToast();

  const {
    webhook,
    loading,
    error,
    getWebhook,
    setWebhook,
    updateWebhook,
    deleteWebhook,
    getWebhookEvents,
  } = useWebhooks();

  const [formData, setFormData] = useState({
    url: "",
    secret: "",
    enabled: false,
    events: [] as string[],
  });
  const [availableEvents, setAvailableEvents] = useState<Record<string, string[]>>({});
  const [selectedEventCategory, setSelectedEventCategory] = useState<string>("");
  const [isNewWebhook, setIsNewWebhook] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    if (sessionId) {
      getWebhook(sessionId);
      getWebhookEvents().then((events) => {
        setAvailableEvents(events.categories);
        if (Object.keys(events.categories).length > 0) {
          setSelectedEventCategory(Object.keys(events.categories)[0]);
        }
      });
    }
  }, [sessionId, getWebhook, getWebhookEvents]);

  useEffect(() => {
    if (webhook) {
      setFormData({
        url: webhook.url || "",
        secret: webhook.secret || "",
        enabled: webhook.enabled || false,
        events: webhook.events || [],
      });
      setIsNewWebhook(!webhook.id);
    }
  }, [webhook]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEventToggle = (event: string) => {
    setFormData((prev) => {
      const newEvents = prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event];
      return { ...prev, events: newEvents };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAction(true);

    try {
      if (isNewWebhook) {
        await setWebhook(sessionId, formData);
        toast({
          title: "Webhook criado com sucesso",
          description: "A configuração do webhook foi salva com sucesso.",
        });
      } else {
        await updateWebhook(sessionId, formData);
        toast({
          title: "Webhook atualizado com sucesso",
          description: "A configuração do webhook foi atualizada com sucesso.",
        });
      }
      router.push(`/sessions/${sessionId}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar webhook",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao salvar o webhook.",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    setIsLoadingAction(true);
    try {
      await deleteWebhook(sessionId);
      toast({
        title: "Webhook excluído com sucesso",
        description: "A configuração do webhook foi excluída com sucesso.",
      });
      router.push(`/sessions/${sessionId}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir webhook",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao excluir o webhook.",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (loading && !webhook) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {isNewWebhook ? "Configurar Webhook" : "Editar Webhook"}
        </h1>
        <Button
          variant="outline"
          onClick={() => router.push(`/sessions/${sessionId}`)}
        >
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL do Webhook</Label>
              <Input
                id="url"
                name="url"
                type="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://seu-servidor.com/webhook"
                required
              />
              <p className="text-sm text-gray-500">
                URL para receber os eventos do webhook
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Secret Key (Opcional)</Label>
              <Input
                id="secret"
                name="secret"
                type="text"
                value={formData.secret}
                onChange={handleInputChange}
                placeholder="Chave secreta para verificação"
              />
              <p className="text-sm text-gray-500">
                Chave secreta para verificar a autenticidade dos eventos
              </p>
            </div>

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos do Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Categorias de Eventos</Label>
              <Select
                value={selectedEventCategory}
                onValueChange={setSelectedEventCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(availableEvents).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEventCategory && (
              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availableEvents[selectedEventCategory]?.map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`event-${event}`}
                        checked={formData.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`event-${event}`} className="text-sm">
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Eventos Selecionados</Label>
              <div className="flex flex-wrap gap-2">
                {formData.events.length > 0 ? (
                  formData.events.map((event) => (
                    <Badge key={event} variant="secondary" className="text-sm">
                      {event}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhum evento selecionado
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isNewWebhook || isLoadingAction}
          >
            Excluir
          </Button>
          <div className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/sessions/${sessionId}`)}
              disabled={isLoadingAction}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoadingAction}>
              {isLoadingAction
                ? "Salvando..."
                : isNewWebhook
                ? "Criar Webhook"
                : "Atualizar Webhook"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}