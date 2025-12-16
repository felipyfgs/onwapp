"use client"

import { Copy, Crown, LinkIcon, LogOut, MoreHorizontal, Shield, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Group {
  jid: string
  name: string
  topic?: string
  pictureUrl?: string
  participantCount: number
  isAdmin?: boolean
  isOwner?: boolean
  isCommunity?: boolean
}

interface GroupItemProps {
  group: Group
  onLeave?: (group: Group) => void
  onGetInviteLink?: (group: Group) => void
  onClick?: (group: Group) => void
}

export function GroupItem({ group, onLeave, onGetInviteLink, onClick }: GroupItemProps) {
  const initials = group.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => onClick?.(group)}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={group.pictureUrl} alt={group.name} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{group.name}</span>
          {group.isOwner && (
            <Badge variant="default" className="gap-1 text-xs">
              <Crown className="h-3 w-3" />
              Owner
            </Badge>
          )}
          {group.isAdmin && !group.isOwner && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
          {group.isCommunity && (
            <Badge variant="outline" className="text-xs">
              Community
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{group.participantCount} participants</span>
        </div>
        {group.topic && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {group.topic}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onGetInviteLink?.(group)
            }}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Get Invite Link
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(group.jid)
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy JID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onLeave?.(group)
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
