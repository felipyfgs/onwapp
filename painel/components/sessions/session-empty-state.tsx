"use client"

import { Button } from "@/components/ui/button"
import { Smartphone, Plus } from "lucide-react"
import { CreateSessionDialog } from "./create-session-dialog"

interface SessionEmptyStateProps {
  hasFilters: boolean
  onSessionCreated?: () => void
}

export function SessionEmptyState({ hasFilters, onSessionCreated }: SessionEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Smartphone className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-1">Nenhuma sessão encontrada</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
        {hasFilters 
          ? "Tente ajustar os filtros ou termo de busca"
          : "Crie sua primeira sessão para começar a usar o WhatsApp"}
      </p>
      <CreateSessionDialog 
        onSuccess={onSessionCreated}
        trigger={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            {hasFilters ? "Criar nova sessão" : "Criar primeira sessão"}
          </Button>
        }
      />
    </div>
  )
}
