"use client"

import { Ban, MoreHorizontal, Phone, Briefcase } from "lucide-react"

import { Contact } from "@/lib/api/contacts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ContactItemProps {
  contact: Contact
  onBlock?: (contact: Contact) => void
  onUnblock?: (contact: Contact) => void
  onClick?: (contact: Contact) => void
}

function getInitials(name?: string): string {
  if (!name) return "?"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function formatPhone(jid: string): string {
  const phone = jid.split("@")[0]
  if (phone.length > 10) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4)}`
  }
  return phone
}

export function ContactItem({ contact, onBlock, onUnblock, onClick }: ContactItemProps) {
  const displayName = contact.name || contact.pushName || formatPhone(contact.jid)

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={() => onClick?.(contact)}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={contact.profilePictureUrl} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{displayName}</span>
          {contact.isBusiness && (
            <Badge variant="secondary" className="h-5">
              <Briefcase className="mr-1 h-3 w-3" />
              Business
            </Badge>
          )}
          {contact.isBlocked && (
            <Badge variant="destructive" className="h-5">
              <Ban className="mr-1 h-3 w-3" />
              Blocked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{formatPhone(contact.jid)}</span>
        </div>
        {contact.about && (
          <p className="text-sm text-muted-foreground truncate mt-1">{contact.about}</p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {contact.isBlocked ? (
            <DropdownMenuItem onClick={() => onUnblock?.(contact)}>
              <Ban className="mr-2 h-4 w-4" />
              Unblock
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onBlock?.(contact)} className="text-destructive">
              <Ban className="mr-2 h-4 w-4" />
              Block
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
