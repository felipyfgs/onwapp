"use client";

import { Contact } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BusinessProfileCard } from "./BusinessProfileCard";
import { ContactDetails } from "@/hooks/contact";

interface ContactDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  details: ContactDetails;
  loading: boolean;
}

export function ContactDetailsModal({
  open,
  onOpenChange,
  contact,
  details,
  loading,
}: ContactDetailsModalProps) {
  if (!contact) return null;

  const name = contact.name || contact.pushName;
  const initials = name ? name.substring(0, 2).toUpperCase() : "??";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              {contact.profilePicture && <AvatarImage src={contact.profilePicture} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{name}</h3>
              <p className="text-sm text-muted-foreground">{contact.jid.split("@")[0]}</p>
            </div>
          </div>
          <Separator />
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading details...</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium text-muted-foreground">JID</span>
                <span className="col-span-2 break-all">{contact.jid}</span>
              </div>
              {details.lid && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">LID</span>
                  <span className="col-span-2 break-all">{details.lid}</span>
                </div>
              )}
              {contact.isBusiness && details.profile && (
                <BusinessProfileCard profile={details.profile} />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
