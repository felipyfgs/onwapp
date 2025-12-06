'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SessionStatus } from '@/types/session'

interface SessionsFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: SessionStatus | 'all'
  onStatusChange: (value: SessionStatus | 'all') => void
}

export function SessionsFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: SessionsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar sessão por nome, telefone ou push name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-11"
        />
      </div>
      <div className="flex gap-3 items-center">
        <span className="text-sm text-gray-600 font-medium">Filtrar por status:</span>
        <Select value={status} onValueChange={(v) => onStatusChange(v as SessionStatus | 'all')}>
          <SelectTrigger className="w-[200px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-11">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent className="border-gray-200 shadow-lg">
            <SelectItem value="all" className="flex items-center gap-2">
              <span>📋 Todos os status</span>
            </SelectItem>
            <SelectItem value="connected" className="flex items-center gap-2">
              <span>🟢 Conectados</span>
            </SelectItem>
            <SelectItem value="connecting" className="flex items-center gap-2">
              <span>🟡 Conectando</span>
            </SelectItem>
            <SelectItem value="disconnected" className="flex items-center gap-2">
              <span>🔴 Desconectados</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
