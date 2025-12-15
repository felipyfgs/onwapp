import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";


interface SessionGeneralTabProps {
    session: {
        id: string;
        apiKey: string;
        createdAt: string;
        updatedAt: string;
        status: string;
    };
    events: any[]; // Replace 'any' with proper Event type if available from hooks
}

export function SessionGeneralTab({ session, events }: SessionGeneralTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Informações da Sessão</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">ID da Sessão</p>
                            <p className="font-medium">{session.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">API Key</p>
                            <p className="font-medium">{session.apiKey}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Criado em</p>
                            <p className="font-medium">
                                {new Date(session.createdAt).toLocaleString("pt-BR")}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Atualizado em</p>
                            <p className="font-medium">
                                {new Date(session.updatedAt).toLocaleString("pt-BR")}
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
                            .filter((event) => event.sessionId === session.id)
                            .map((event, index) => (
                                <div key={index} className="mb-2 p-2 border rounded-md">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{event.event}</span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(event.timestamp).toLocaleTimeString("pt-BR")}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{event.status}</p>
                                </div>
                            ))}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
