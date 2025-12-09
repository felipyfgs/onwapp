"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Plus } from "lucide-react"

interface SessionEmptyStateProps {
  hasFilters: boolean
}

export function SessionEmptyState({ hasFilters }: SessionEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Smartphone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhuma sessao encontrada</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-4">
          {hasFilters 
            ? "Tente ajustar os filtros ou termo de busca"
            : "Crie sua primeira sessao para comecar a usar o WhatsApp"}
        </p>
        {!hasFilters && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Sessao
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
