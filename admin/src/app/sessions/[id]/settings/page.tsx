"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";

interface SessionSettings {
  id: string;
  sessionID: string;
  alwaysOnline: boolean;
  autoRejectCalls: boolean;
  syncHistory: boolean;
  lastSeen: string;
  online: string;
  profilePhoto: string;
  status: string;
  readReceipts: string;
  groupAdd: string;
  callAdd: string;
  defaultDisappearingTimer: string;
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { toast } = useToast();

  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const privacyOptions = {
    lastSeen: ["all", "contacts", "contact_blacklist", "none"],
    online: ["all", "match_last_seen"],
    profilePhoto: ["all", "contacts", "contact_blacklist", "none"],
    status: ["all", "contacts", "contact_blacklist", "none"],
    readReceipts: ["all", "none"],
    groupAdd: ["all", "contacts", "admin", "none"],
    callAdd: ["all", "contacts", "none"],
  };

  const disappearingTimerOptions = [
    "off",
    "5s",
    "15s",
    "30s",
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
    "6h",
    "12h",
    "1d",
    "7d",
  ];

  useEffect(() => {
    if (sessionId) {
      fetchSettings();
    }
  }, [sessionId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.getSettings(sessionId);
      setSettings(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch settings");
      toast({
        variant: "destructive",
        title: "Erro ao buscar configurações",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao buscar as configurações.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsLoadingAction(true);

    try {
      const response = await api.updateSettings(sessionId, settings);
      setSettings(response.data);
      toast({
        title: "Configurações atualizadas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar configurações",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao atualizar as configurações.",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (loading && !settings) {
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
        <h1 className="text-2xl font-bold">Configurações da Sessão</h1>
        <Button variant="outline" onClick={() => router.push(`/sessions/${sessionId}`)}>
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="alwaysOnline"
                name="alwaysOnline"
                checked={settings?.alwaysOnline ?? false}
                onCheckedChange={(checked) =>
                  setSettings((prev) => {
                    if (!prev) return null;
                    return { ...prev, alwaysOnline: checked };
                  })
                }
              />
              <Label htmlFor="alwaysOnline">Sempre Online</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoRejectCalls"
                name="autoRejectCalls"
                checked={settings?.autoRejectCalls ?? false}
                onCheckedChange={(checked) =>
                  setSettings((prev) => {
                    if (!prev) return null;
                    return { ...prev, autoRejectCalls: checked };
                  })
                }
              />
              <Label htmlFor="autoRejectCalls">Rejeitar Chamadas Automáticamente</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="syncHistory"
                name="syncHistory"
                checked={settings?.syncHistory ?? false}
                onCheckedChange={(checked) =>
                  setSettings((prev) => {
                    if (!prev) return null;
                    return { ...prev, syncHistory: checked };
                  })
                }
              />
              <Label htmlFor="syncHistory">Sincronizar Histórico</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Privacidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(privacyOptions).map(([key, options]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key}</Label>
                <Select
                  value={settings?.[key as keyof typeof privacyOptions] ?? ""}
                  onValueChange={(value) => handleSelectChange(key, value)}
                >
                  <SelectTrigger id={key}>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timer de Mensagens Desaparecidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultDisappearingTimer">Timer Padrão</Label>
              <Select
                value={settings?.defaultDisappearingTimer ?? ""}
                onValueChange={(value) => handleSelectChange("defaultDisappearingTimer", value)}
              >
                <SelectTrigger id="defaultDisappearingTimer">
                  <SelectValue placeholder="Selecione um timer" />
                </SelectTrigger>
                <SelectContent>
                  {disappearingTimerOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoadingAction}>
            {isLoadingAction ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}