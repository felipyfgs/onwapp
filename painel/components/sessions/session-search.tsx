'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SessionSearchProps {
  value?: string
  onChange?: (value: string) => void
}

export function SessionSearch({ value, onChange }: SessionSearchProps) {
  return (
    <div className="mb-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar sessões..."
          className="h-9 pl-10"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    </div>
  )
}
