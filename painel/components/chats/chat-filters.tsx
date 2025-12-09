"use client"

import { Users, User, Archive, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type FilterType = 'all' | 'unread' | 'private' | 'groups' | 'archived'

interface ChatFiltersProps {
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts: {
    all: number
    unread: number
    private: number
    groups: number
    archived: number
  }
}

export function ChatFilters({ filter, onFilterChange, counts }: ChatFiltersProps) {
  const filters: { key: FilterType; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'unread', label: 'Nao lidas', icon: <MessageCircle className="size-3.5" /> },
    { key: 'private', label: 'Privadas', icon: <User className="size-3.5" /> },
    { key: 'groups', label: 'Grupos', icon: <Users className="size-3.5" /> },
    { key: 'archived', label: 'Arquivadas', icon: <Archive className="size-3.5" /> },
  ]

  return (
    <div className="flex gap-1.5 px-2 py-2 border-b overflow-x-auto">
      {filters.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
            "hover:scale-105 active:scale-95",
            filter === key 
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          )}
        >
          {icon}
          {label}
          {counts[key] > 0 && key !== 'all' && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full transition-colors duration-200",
              filter === key 
                ? "text-primary-foreground/90 bg-primary-foreground/20" 
                : "text-muted-foreground/70"
            )}>
              {counts[key]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
