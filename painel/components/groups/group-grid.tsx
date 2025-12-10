"use client"

import { Group } from "@/lib/api/groups"
import { GroupCard } from "./group-card"

interface GroupGridProps {
  groups: Group[]
  onGroupClick: (group: Group) => void
}

export function GroupGrid({ groups, onGroupClick }: GroupGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <GroupCard key={group.jid} group={group} onClick={() => onGroupClick(group)} />
      ))}
    </div>
  )
}
