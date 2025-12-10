"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Contact } from "@/lib/api/contacts"

interface ContactListProps {
  contacts: Contact[]
}

function getInitials(contact: Contact) {
  const name = contact.name || contact.pushName || contact.businessName || ""
  return name.slice(0, 2).toUpperCase() || "?"
}

function getDisplayName(contact: Contact) {
  return contact.name || contact.pushName || contact.businessName || contact.phone || contact.jid
}

function formatPhone(jid: string) {
  const phone = jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
  return `+${phone}`
}

export function ContactList({ contacts }: ContactListProps) {
  if (contacts.length === 0) {
    return null
  }

  return (
    <div className="border border-border rounded-lg divide-y divide-border">
      {contacts.map((contact) => (
        <ContactListItem key={contact.jid} contact={contact} />
      ))}
    </div>
  )
}

interface ContactListItemProps {
  contact: Contact
}

export function ContactListItem({ contact }: ContactListItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={contact.profilePicture} alt={getDisplayName(contact)} />
        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
          {getInitials(contact)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{getDisplayName(contact)}</span>
          {contact.isBusiness && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              Business
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {formatPhone(contact.jid)}
          {contact.pushName && contact.name && contact.pushName !== contact.name && (
            <span> · {contact.pushName}</span>
          )}
        </p>
      </div>
    </div>
  )
}
