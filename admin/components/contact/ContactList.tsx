"use client";

import { Contact } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

interface ContactListProps {
  contacts: Contact[];
  loading: boolean;
  searchQuery: string;
  onContactClick: (contact: Contact) => void;
}

export function ContactList({ contacts, loading, searchQuery, onContactClick }: ContactListProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/50 p-12 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No contacts found</h3>
        <p className="text-muted-foreground">
          {searchQuery ? "Try adjusting your search" : "No contacts in this session"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {contacts.map((contact) => {
        const name = contact.name || contact.pushName || contact.jid.split("@")[0];
        const initials = name.substring(0, 2).toUpperCase();

        return (
          <div
            key={contact.jid}
            className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => onContactClick(contact)}
          >
            <Avatar className="h-12 w-12">
              {contact.profilePicture && <AvatarImage src={contact.profilePicture} alt={name} />}
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
      })}
    </div>
  );
}
