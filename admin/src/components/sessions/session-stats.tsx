import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Wifi, WifiOff } from "lucide-react";

interface SessionStatsProps {
    counts: {
        total: number;
        connected: number;
        disconnected: number;
    };
}

export function SessionStats({ counts }: SessionStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Total</p>
                        <h3 className="text-2xl font-bold text-foreground">{counts.total}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Wifi className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Conectadas</p>
                        <h3 className="text-2xl font-bold text-foreground">{counts.connected}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <WifiOff className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">Desconectadas</p>
                        <h3 className="text-2xl font-bold text-foreground">{counts.disconnected}</h3>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
