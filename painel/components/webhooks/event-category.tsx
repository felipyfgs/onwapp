"use client"

import { Check, ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface EventCategoryProps {
  category: string
  events: string[]
  selectedEvents: string[]
  isOpen: boolean
  onToggle: () => void
  onToggleEvent: (event: string) => void
  onToggleAll: () => void
}

export function EventCategory({
  category,
  events,
  selectedEvents,
  isOpen,
  onToggle,
  onToggleEvent,
  onToggleAll,
}: EventCategoryProps) {
  const selectedCount = events.filter(e => selectedEvents.includes(e)).length
  const allSelected = selectedCount === events.length

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="flex items-center">
        <CollapsibleTrigger className="flex-1 flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors">
          <ChevronDown className={`size-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          <span className="text-sm capitalize">{category}</span>
          <span className="text-xs text-muted-foreground ml-auto mr-2">
            {selectedCount}/{events.length}
          </span>
        </CollapsibleTrigger>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleAll() }}
          className={`mr-3 size-5 rounded border flex items-center justify-center transition-colors ${
            allSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
          }`}
        >
          {allSelected && <Check className="size-3 text-primary-foreground" />}
        </button>
      </div>
      <CollapsibleContent>
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {events.map((event) => (
            <button
              key={event}
              onClick={() => onToggleEvent(event)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                selectedEvents.includes(event)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {event.replace(`${category}.`, '')}
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
