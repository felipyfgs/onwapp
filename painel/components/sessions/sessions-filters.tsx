import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RefreshCw } from "lucide-react"
import type { SessionStatus } from "@/lib/types/session"

interface SessionsFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: SessionStatus | "all"
  onStatusChange: (value: SessionStatus | "all") => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export function SessionsFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onRefresh,
  isRefreshing = false,
}: SessionsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-2">
        <Input
          placeholder="Buscar sessão..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="connected">Conectadas</SelectItem>
            <SelectItem value="connecting">Conectando</SelectItem>
            <SelectItem value="disconnected">Desconectadas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Atualizando..." : "Atualizar"}
      </Button>
    </div>
  )
}
