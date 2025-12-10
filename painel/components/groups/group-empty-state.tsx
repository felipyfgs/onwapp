"use client"

import { Users } from "lucide-react"

interface GroupEmptyStateProps {
  hasSearch: boolean
}

export function GroupEmptyState({ hasSearch }: GroupEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">
        {hasSearch ? "Nenhum grupo encontrado" : "Nenhum grupo"}
      </p>
    </div>
  )
}
