"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Queue } from "@/lib/nats/nats-types"

interface QueueSelectProps {
  queues: Queue[]
  selectedQueue: Queue | null
  onSelect: (queue: Queue | null) => void
  className?: string
  size?: 'default' | 'sm' | 'compact'
}

export function QueueSelect({ 
  queues, 
  selectedQueue, 
  onSelect, 
  className = "",
  size = 'default'
}: QueueSelectProps) {

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 text-xs px-2'
      case 'compact':
        return 'h-8 text-xs px-2 w-24'
      default:
        return 'h-10'
    }
  }

  const getTriggerContent = () => {
    if (selectedQueue) {
      if (size === 'compact') {
        return <span>{selectedQueue.icon}</span>
      }
      return (
        <div className="flex items-center gap-2">
          <span>{selectedQueue.icon}</span>
          <span>{selectedQueue.name}</span>
        </div>
      )
    }
    return size === 'compact' ? '📋' : "Selecione uma fila"
  }

  return (
    <Select 
      value={selectedQueue?.id || "none"} 
      onValueChange={(value) => {
        if (value === "none") onSelect(null)
        else onSelect(queues.find(q => q.id === value) || null)
      }}
    >
      <SelectTrigger className={`${getSizeClasses()} ${className}`}>
        <SelectValue>
          {getTriggerContent()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span>Todas as filas</span>
          </div>
        </SelectItem>
        {queues.filter(q => q.id !== "all").map(queue => (
          <SelectItem key={queue.id} value={queue.id}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{queue.icon}</span>
              <span>{queue.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}