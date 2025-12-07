'use client'

import { Button } from '@/components/ui/button'
import { StatusFilter } from './types'

interface SessionFiltersProps {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
  counts: {
    all: number
    connected: number
    disconnected: number
    connecting: number
  }
}

export function SessionFilters({ value, onChange, counts }: SessionFiltersProps) {
  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'connected', label: 'Conectadas' },
    { key: 'disconnected', label: 'Desconectadas' },
    { key: 'connecting', label: 'Conectando' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto">
      {filters.map((filter) => {
        const count = counts[filter.key]
        const isActive = value === filter.key

        return (
          <Button
            key={filter.key}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(filter.key)}
            className="shrink-0"
          >
            {filter.label}
            <span className={`ml-1.5 text-xs ${isActive ? 'opacity-80' : 'text-muted-foreground'}`}>
              {count}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
