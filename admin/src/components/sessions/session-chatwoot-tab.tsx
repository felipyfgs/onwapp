import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatwoot } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SessionChatwootTabProps {
    sessionId: string;
}

export function SessionChatwootTab({ sessionId }: SessionChatwootTabProps) {
    const router = useRouter();
    const {
        chatwootConfig,
        loading: chatwootLoading,
        error: chatwootError,
        getChatwootConfig,
        resetChatwoot,
    } = useChatwoot();

    useEffect(() => {
        if (sessionId) {
            getChatwootConfig(sessionId);
        }
    }, [sessionId, getChatwootConfig]);

    if (chatwootLoading) {
        return <Skeleton className="h-48" />;
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
        <Card>
            <CardHeader>
                <CardTitle>Integração Chatwoot</CardTitle>
            </CardHeader>
            <CardContent>
                {chatwootConfig ? (
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
                                onClick={() => router.push(`/sessions/${sessionId}/chatwoot`)}
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
                        <h3 className="text-lg font-medium">Chatwoot não configurado</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Esta sessão não tem integração com Chatwoot configurada.
                        </p>
                        <Button
                            onClick={() => router.push(`/sessions/${sessionId}/chatwoot`)}
                        >
                            Configurar Chatwoot
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
