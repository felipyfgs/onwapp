import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SessionDeviceTabProps {
    device?: {
        platform: string;
        pushName: string;
        jid: string;
    };
}

export function SessionDeviceTab({ device }: SessionDeviceTabProps) {
    if (!device) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Nenhum dispositivo conectado</AlertTitle>
                <AlertDescription>
                    Esta sessão não tem nenhum dispositivo conectado no momento.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dispositivo Conectado</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${device.pushName}`}
                        />
                        <AvatarFallback>
                            {device.pushName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-lg font-medium">{device.pushName}</h3>
                        <p className="text-sm text-gray-500">Plataforma: {device.platform}</p>
                        <p className="text-sm text-gray-500">JID: {device.jid}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
