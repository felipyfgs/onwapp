import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SessionStatsTabProps {
    stats?: {
        messages: number;
        chats: number;
        contacts: number;
        groups: number;
    };
}

export function SessionStatsTab({ stats }: SessionStatsTabProps) {
    if (!stats) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Estatísticas não disponíveis</AlertTitle>
                <AlertDescription>
                    As estatísticas ainda não estão disponíveis para esta sessão.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Mensagens</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.messages}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Chats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.chats}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Contatos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.contacts}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Grupos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.groups}</div>
                </CardContent>
            </Card>
        </div>
    );
}
