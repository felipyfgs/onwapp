"use client";

import { Contact } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ContactCardProps {
  contact: Contact;
  onClick?: (contact: Contact) => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const name = contact.name || contact.pushName || contact.jid.split("@")[0];
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div
      className={`flex items-center gap-4 p-4 border-b last:border-b-0 transition-colors ${
        onClick ? "hover:bg-accent cursor-pointer" : ""
      }`}
      onClick={() => onClick?.(contact)}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{name}</p>
          {contact.isBusiness && (
            <Badge variant="secondary" className="text-xs">Business</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {contact.phone || contact.jid.split("@")[0]}
        </p>
      </div>
    </div>
  );
}
