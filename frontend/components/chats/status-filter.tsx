"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StatusFilterProps {
  status: 'all' | 'open' | 'pending' | 'closed'
  onStatusChange: (status: 'all' | 'open' | 'pending' | 'closed') => void
  className?: string
}

export function StatusFilter({ status, onStatusChange, className = "" }: StatusFilterProps) {
  return (
    <Tabs 
      value={status} 
      onValueChange={(value) => onStatusChange(value as 'all' | 'open' | 'pending' | 'closed')} 
      className={`w-full ${className}`}
    >
      <TabsList className="grid grid-cols-4 w-full h-8">
        <TabsTrigger value="all" className="text-xs">Tudo</TabsTrigger>
        <TabsTrigger value="open" className="text-xs">Aberto</TabsTrigger>
        <TabsTrigger value="pending" className="text-xs">Pendente</TabsTrigger>
        <TabsTrigger value="closed" className="text-xs">Fechado</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}