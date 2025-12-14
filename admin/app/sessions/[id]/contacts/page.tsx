"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/common";
import { useContacts, useBlocklist } from "@/hooks/contact";
import {
  ContactsToolbar,
  ContactsStats,
  ContactList,
  BlocklistDialog,
  ContactQRDialog,
  ContactDetailsModal,
  CheckPhoneDialog,
} from "@/components/contact";

export default function ContactsPage() {
  const params = useParams();
  const sessionId = params.id as string;

  // Hooks
  const contacts = useContacts(sessionId);
  const blocklist = useBlocklist(sessionId);

  // Dialog states
  const [checkPhoneOpen, setCheckPhoneOpen] = useState(false);
  const [blocklistOpen, setBlocklistOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleContactClick = (contact: any) => {
    contacts.handleContactClick(contact);
    setDetailsOpen(true);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader
          breadcrumbs={[
            { label: "Sessions", href: "/sessions" },
            { label: sessionId, href: `/sessions/${sessionId}` },
            { label: "Contacts" },
          ]}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ContactsToolbar
            searchQuery={contacts.searchQuery}
            onSearchChange={contacts.setSearchQuery}
            onRefresh={contacts.fetchContacts}
            onCheckPhoneClick={() => setCheckPhoneOpen(true)}
            onBlocklistClick={() => setBlocklistOpen(true)}
            onQRClick={() => setQrOpen(true)}
            disabled={!sessionId}
          />

          <ContactsStats
            totalCount={contacts.totalCount}
            businessCount={contacts.businessCount}
            withNameCount={contacts.withNameCount}
          />

          <ContactList
            contacts={contacts.filteredContacts}
            loading={contacts.loading}
            searchQuery={contacts.searchQuery}
            onContactClick={handleContactClick}
          />

          <CheckPhoneDialog
            open={checkPhoneOpen}
            onOpenChange={setCheckPhoneOpen}
            onCheck={contacts.handleCheckPhone}
            result={contacts.checkResult}
            checking={contacts.checking}
            onResultClear={() => contacts.setCheckResult(null)}
          />

          <BlocklistDialog
            open={blocklistOpen}
            onOpenChange={setBlocklistOpen}
            blocklist={blocklist.blocklist}
            loading={blocklist.loading}
            blockPhone={blocklist.blockPhone}
            onBlockPhoneChange={blocklist.setBlockPhone}
            onBlock={blocklist.handleBlock}
            onUnblock={blocklist.handleUnblock}
            onFetchBlocklist={blocklist.fetchBlocklist}
          />

          <ContactQRDialog
            open={qrOpen}
            onOpenChange={setQrOpen}
            qrLink={contacts.qrLink}
            loading={contacts.loadingQr}
            onFetchQRLink={contacts.fetchQRLink}
          />

          <ContactDetailsModal
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            contact={contacts.selectedContact}
            details={contacts.contactDetails}
            loading={contacts.loadingDetails}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
