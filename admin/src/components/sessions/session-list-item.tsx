import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Power,
    PowerOff,
    Trash2,
    RefreshCw,
    Settings,
    QrCode,
    Smartphone,
    ChevronRight
} from "lucide-react";
import { QRCodeDialog } from "./qr-code-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SessionListItemProps {
    session: any;
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
                return <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />;
            case "disconnected":
                return <div className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" />;
            case "connecting":
                return <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />;
            case "qr":
                return <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />;
            default:
                return <div className="h-2 w-2 rounded-full bg-muted-foreground" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "connected": return "Conectado";
            case "disconnected": return "Desconectado";
            case "connecting": return "Conectando...";
            case "qr": return "Aguardando QR Code";
            default: return "Desconhecido";
        }
    };

    return (
        <>
            <Card className="bg-card border-border hover:bg-accent/5 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.session}`}
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                                {session.session.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">{session.session}</h4>
                                {session.status === 'qr' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-primary"
                                        onClick={() => setQrDialogOpen(true)}
                                    >
                                        <QrCode className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getStatusIndicator(session.status)}
                                <span>{getStatusText(session.status)}</span>
                            </div>
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
                                            onClick={() => handleAction('connect', () => onConnect(session.id))}
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
                                            onClick={() => handleAction('disconnect', () => onDisconnect(session.id))}
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
                                        onClick={() => handleAction('restart', () => onRestart(session.id))}
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
                                        onClick={() => handleAction('delete', () => onDelete(session.id))}
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
                </CardContent>
            </Card>

            <QRCodeDialog
                open={qrDialogOpen}
                onOpenChange={setQrDialogOpen}
                sessionId={session.id}
            />
        </>
    );
}
