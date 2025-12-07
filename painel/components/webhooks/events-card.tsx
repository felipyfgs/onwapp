"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EventCategory } from "./event-category"

interface EventsCardProps {
  categories: Record<string, string[]>
  selectedEvents: string[]
  openCategories: string[]
  onToggleCategory: (category: string) => void
  onToggleEvent: (event: string) => void
  onToggleAllInCategory: (events: string[]) => void
  onSelectAll: () => void
  onClearAll: () => void
  totalEvents: number
}

export function EventsCard({
  categories,
  selectedEvents,
  openCategories,
  onToggleCategory,
  onToggleEvent,
  onToggleAllInCategory,
  onSelectAll,
  onClearAll,
  totalEvents,
}: EventsCardProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-medium">
            Eventos ({selectedEvents.length}/{totalEvents})
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onSelectAll}>
              Todos
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClearAll}>
              Nenhum
            </Button>
          </div>
        </div>

        <div>
          {Object.entries(categories).map(([category, events]) => (
            <EventCategory
              key={category}
              category={category}
              events={events}
              selectedEvents={selectedEvents}
              isOpen={openCategories.includes(category)}
              onToggle={() => onToggleCategory(category)}
              onToggleEvent={onToggleEvent}
              onToggleAll={() => onToggleAllInCategory(events)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
