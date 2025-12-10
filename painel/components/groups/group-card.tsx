"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Group } from "@/lib/api/groups"

interface GroupCardProps {
  group: Group
  onClick: () => void
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase() || "G"
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <button
      onClick={onClick}
      className="text-left border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors space-y-2"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={group.profilePicture} alt={group.name} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {getInitials(group.name || "Grupo")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{group.name || "Grupo"}</p>
          <p className="text-sm text-muted-foreground">
            {group.participantCount || "?"} participantes
          </p>
        </div>
      </div>
      {group.topic && (
        <p className="text-sm text-muted-foreground line-clamp-2">{group.topic}</p>
      )}
    </button>
  )
}
