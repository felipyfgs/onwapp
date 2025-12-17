"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WEBHOOK_EVENTS } from "@/lib/api/webhook"

interface EventSelectorProps {
  selectedEvents: string[]
  onChange: (events: string[]) => void
}

const eventGroups = [
  {
    name: "Connection",
    events: ["session.connected", "session.disconnected", "session.qr", "session.logged_out"],
  },
  {
    name: "Messages",
    events: [
      "message.received",
      "message.sent",
      "message.delivered",
      "message.read",
      "message.played",
      "message.reaction",
      "message.edited",
      "message.deleted",
    ],
  },
  {
    name: "Chat",
    events: ["chat.presence", "chat.archived"],
  },
  {
    name: "Groups",
    events: [
      "group.created",
      "group.updated",
      "group.participant_added",
      "group.participant_removed",
    ],
  },
  {
    name: "Calls",
    events: ["call.received", "call.missed"],
  },
]

const ALL_EVENT_NAMES = WEBHOOK_EVENTS.map(e => e.name)

export function EventSelector({ selectedEvents, onChange }: EventSelectorProps) {
  const handleToggle = (event: string) => {
    if (selectedEvents.includes(event)) {
      onChange(selectedEvents.filter((e) => e !== event))
    } else {
      onChange([...selectedEvents, event])
    }
  }

  const handleSelectAll = () => {
    if (selectedEvents.length === ALL_EVENT_NAMES.length) {
      onChange([])
    } else {
      onChange([...ALL_EVENT_NAMES])
    }
  }

  const handleSelectGroup = (groupEvents: string[]) => {
    const allSelected = groupEvents.every((e) => selectedEvents.includes(e))
    if (allSelected) {
      onChange(selectedEvents.filter((e) => !groupEvents.includes(e)))
    } else {
      const newEvents = [...selectedEvents]
      groupEvents.forEach((e) => {
        if (!newEvents.includes(e)) {
          newEvents.push(e)
        }
      })
      onChange(newEvents)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Webhook Events</CardTitle>
            <CardDescription>Select which events to receive</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedEvents.length === WEBHOOK_EVENTS.length}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm cursor-pointer">
              Select All
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {eventGroups.map((group) => {
          const groupSelected = group.events.every((e) => selectedEvents.includes(e))
          const groupPartial = group.events.some((e) => selectedEvents.includes(e)) && !groupSelected

          return (
            <div key={group.name} className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`group-${group.name}`}
                  checked={groupSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = groupPartial
                    }
                  }}
                  onCheckedChange={() => handleSelectGroup(group.events)}
                />
                <Label
                  htmlFor={`group-${group.name}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {group.name}
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                {group.events.map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <Checkbox
                      id={event}
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => handleToggle(event)}
                    />
                    <Label
                      htmlFor={event}
                      className="text-sm cursor-pointer font-mono text-muted-foreground"
                    >
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
