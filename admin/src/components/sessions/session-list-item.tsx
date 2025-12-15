import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Power,
    PowerOff,
    Trash2,
    RefreshCw,
    Settings,
    QrCode,
    Smartphone,
    ChevronRight,
    Wifi,
    WifiOff,
    AlertCircle,
    Loader2
} from "lucide-react";
import { QRCodeDialog } from "./qr-code-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Session } from "@/types/session";

interface SessionListItemProps {
    session: Session;
    onConnect: (id: string) => Promise<void>;
    onDisconnect: (id: string) => Promise<void>;
    onRestart: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function SessionListItem({
    session,
    onConnect,
    onDisconnect,
    onRestart,
    onDelete,
}: SessionListItemProps) {
    const router = useRouter();
    const [qrDialogOpen, setQrDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleAction = async (action: string, callback: () => Promise<void>) => {
        setActionLoading(action);
        try {
            await callback();
        } catch (error) {
            // Error handling usually done in parent but we can catch here too
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case "connected":
                return <Wifi className="h-4 w-4 text-green-500" />;
            case "disconnected":
                return <WifiOff className="h-4 w-4 text-red-500" />;
            case "connecting":
                return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
            case "qr":
                return <QrCode className="h-4 w-4 text-blue-500 animate-pulse" />;
            case "error":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <WifiOff className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            connected: "default",
            disconnected: "destructive",
            connecting: "secondary", 
            qr: "outline",
            error: "destructive"
        } as const;

        const texts = {
            connected: "Conectado",
            disconnected: "Desconectado", 
            connecting: "Conectando",
            qr: "QR Code",
            error: "Erro"
        };

        const variant = variants[status as keyof typeof variants] || "secondary";
        const text = texts[status as keyof typeof texts] || "Desconhecido";

        return (
            <Badge variant={variant} className="text-xs">
                {text}
            </Badge>
        );
    };

    const getStatusDescription = (status: string) => {
        const descriptions = {
            connected: "Sessão conectada e pronta para uso",
            disconnected: "Sessão desconectada",
            connecting: "Estabelecendo conexão com WhatsApp",
            qr: "Escaneie o QR Code para conectar",
            error: "Erro na conexão. Tente reiniciar."
        };

        return descriptions[status as keyof typeof descriptions] || "Status desconhecido";
    };

    return (
        <>
            <Card className="bg-card border-border hover:bg-accent/5 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-border">
                                    <AvatarImage
                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.session}`}
                                    />
                                    <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                                        {session.session.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1">
                                    {getStatusIndicator(session.status)}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-foreground">{session.session}</h4>
                                    {session.status === 'qr' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-primary hover:bg-primary/10"
                                            onClick={() => setQrDialogOpen(true)}
                                        >
                                            <QrCode className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(session.status)}
                                    <span className="text-xs text-muted-foreground">
                                        {getStatusDescription(session.status)}
                                    </span>
                                </div>
                                {session.device && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Smartphone className="h-3 w-3" />
                                        <span>{session.device.platform} • {session.device.pushName}</span>
                                    </div>
                                )}
                                {session.createdAt && (
                                    <div className="text-xs text-muted-foreground">
                                        Criado {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                        <TooltipProvider>
                            {session.status === 'disconnected' && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-primary"
                                            onClick={() => handleAction('connect', () => onConnect(session.session))}
                                            disabled={!!actionLoading}
                                        >
                                            <Power className={`h-4 w-4 ${actionLoading === 'connect' ? 'animate-pulse' : ''}`} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Conectar</TooltipContent>
                                </Tooltip>
                            )}

                            {session.status === 'connected' && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => handleAction('disconnect', () => onDisconnect(session.session))}
                                            disabled={!!actionLoading}
                                        >
                                            <PowerOff className={`h-4 w-4 ${actionLoading === 'disconnect' ? 'animate-pulse' : ''}`} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Desconectar</TooltipContent>
                                </Tooltip>
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary"
                                        onClick={() => handleAction('restart', () => onRestart(session.session))}
                                        disabled={!!actionLoading}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reiniciar</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => handleAction('delete', () => onDelete(session.session))}
                                        disabled={!!actionLoading}
                                    >
                                        <Trash2 className={`h-4 w-4 ${actionLoading === 'delete' ? 'animate-pulse' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary"
                                        onClick={() => router.push(`/sessions/${session.id}`)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Detalhes</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <QRCodeDialog
                open={qrDialogOpen}
                onOpenChange={setQrDialogOpen}
                sessionId={session.session}
            />
        </>
    );
}
