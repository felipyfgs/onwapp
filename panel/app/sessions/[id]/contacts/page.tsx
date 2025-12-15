'use client';

import { ContactList } from "@/components/contact/contact-list";

export default function ContactsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold">Contatos</h2>
        <p className="text-muted-foreground">Gerencie seus contatos do WhatsApp</p>
      </div>
      <ContactList />
    </div>
  );
}
