"use client"

import { Users } from "lucide-react"

interface ContactEmptyStateProps {
  hasFilters: boolean
}

export function ContactEmptyState({ hasFilters }: ContactEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">
        {hasFilters ? "Nenhum contato encontrado" : "Nenhum contato"}
      </p>
    </div>
  )
}
