"use client";

import { Group } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock, Megaphone } from "lucide-react";

interface GroupCardProps {
  group: Group;
  onClick?: (group: Group) => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const initials = group.name.substring(0, 2).toUpperCase();

  return (
    <div
      className={`flex items-center gap-4 p-4 border-b last:border-b-0 transition-colors ${
        onClick ? "hover:bg-muted/50 cursor-pointer" : ""
      }`}
      onClick={() => onClick?.(group)}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{group.name}</p>
          {group.isAnnounce && (
            <Badge variant="secondary" className="text-xs">
              <Megaphone className="h-3 w-3 mr-1" />
              Announce
            </Badge>
          )}
          {group.isLocked && (
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {group.participantCount || group.participants?.length || 0} participants
        </p>
      </div>
    </div>
  );
}
