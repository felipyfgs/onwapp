import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWebhooks } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SessionWebhooksTabProps {
    sessionId: string;
}

export function SessionWebhooksTab({ sessionId }: SessionWebhooksTabProps) {
    const router = useRouter();
    const {
        webhook,
        loading: webhookLoading,
        error: webhookError,
        getWebhook,
        deleteWebhook,
    } = useWebhooks();

    useEffect(() => {
        if (sessionId) {
            getWebhook(sessionId);
        }
    }, [sessionId, getWebhook]);

    if (webhookLoading) {
        return <Skeleton className="h-48" />;
    }

    if (webhookError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{webhookError}</AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuração de Webhook</CardTitle>
            </CardHeader>
            <CardContent>
                {webhook ? (
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
                        <Button onClick={() => router.push(`/sessions/${sessionId}/webhooks`)}>
                            Configurar Webhook
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
