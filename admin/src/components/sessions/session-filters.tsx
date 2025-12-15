import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SessionFiltersProps {
    filter: string;
    setFilter: (filter: string) => void;
    search: string;
    setSearch: (search: string) => void;
    counts: {
        total: number;
        connected: number;
        disconnected: number;
        connecting: number;
    };
}

export function SessionFilters({
    filter,
    setFilter,
    search,
    setSearch,
    counts,
}: SessionFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    className="gap-2"
                >
                    Todas
                    <Badge variant={filter === "all" ? "secondary" : "default"} className="ml-1 px-1.5 py-0.5 text-xs h-auto">
                        {counts.total}
                    </Badge>
                </Button>
                <Button
                    variant={filter === "connected" ? "default" : "outline"}
                    onClick={() => setFilter("connected")}
                    className="gap-2"
                >
                    Conectadas
                    <span className="ml-1 text-xs opacity-70">{counts.connected}</span>
                </Button>
                <Button
                    variant={filter === "disconnected" ? "default" : "outline"}
                    onClick={() => setFilter("disconnected")}
                    className="gap-2"
                >
                    Desconectadas
                    <span className="ml-1 text-xs opacity-70">{counts.disconnected}</span>
                </Button>
                <Button
                    variant={filter === "connecting" ? "default" : "outline"}
                    onClick={() => setFilter("connecting")}
                    className="gap-2"
                >
                    Conectando
                    <span className="ml-1 text-xs opacity-70">{counts.connecting}</span>
                </Button>
            </div>

            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar sessões..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-card border-border"
                />
            </div>
        </div>
    );
}
