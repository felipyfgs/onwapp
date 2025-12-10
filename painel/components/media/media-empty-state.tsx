"use client"

import { Image as ImageIcon } from "lucide-react"

export function MediaEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
      <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Nenhuma mídia encontrada</p>
    </div>
  )
}
