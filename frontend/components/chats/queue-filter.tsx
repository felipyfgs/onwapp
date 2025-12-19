"use client"

import * as React from "react"
import { Check, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Queue } from "@/lib/nats/nats-types"

interface QueueFilterProps {
  queues: Queue[]
  selectedQueue: Queue | null
  onSelect: (queue: Queue | null) => void
  className?: string
}

export function QueueFilter({ queues, selectedQueue, onSelect, className }: QueueFilterProps) {
  const [open, setOpen] = React.useState(false)

  const allQueues = [
    { id: "all", name: "Todas as filas", icon: "📋" },
    ...queues.filter(q => q.id !== "all")
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          role="combobox"
          aria-expanded={open}
          className={cn("h-8 w-8 text-muted-foreground hover:bg-secondary rounded-md", className)}
        >
          <Filter className={cn("h-4 w-4", selectedQueue && selectedQueue.id !== 'all' && "text-primary fill-primary/10")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Filtrar fila..." className="h-8 text-[13px]" />
          <CommandList>
            <CommandEmpty>Nenhuma fila encontrada.</CommandEmpty>
            <CommandGroup>
              {allQueues.map((queue) => (
                <CommandItem
                  key={queue.id}
                  value={queue.id}
                  onSelect={() => {
                    onSelect(queue.id === "all" ? null : (queues.find(q => q.id === queue.id) || null))
                    setOpen(false)
                  }}
                  className="text-[13px] cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-primary",
                      (selectedQueue?.id === queue.id || (!selectedQueue && queue.id === "all")) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2">{queue.icon}</span>
                  {queue.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
