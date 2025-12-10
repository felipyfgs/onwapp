"use client"

import { MessageSquare } from "lucide-react"

interface ChatEmptyStateProps {
  hasFilters: boolean
}

export function ChatEmptyState({ hasFilters }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">
        {hasFilters ? "Nenhuma conversa encontrada" : "Nenhuma conversa"}
      </p>
    </div>
  )
}
