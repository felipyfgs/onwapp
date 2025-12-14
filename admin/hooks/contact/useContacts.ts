import { useState, useCallback, useEffect } from "react";
import {
  getContacts,
  checkPhone,
  getContactInfo,
  getBusinessProfile,
  getContactLID,
  getMyContactQRLink,
  Contact,
  BusinessProfile,
} from "@/lib/api";
import { toast } from "sonner";

export interface ContactDetails {
  profile?: BusinessProfile;
  lid?: string;
  avatar?: string;
}

export function useContacts(sessionId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Check phone state
  const [checkResult, setCheckResult] = useState<{ exists: boolean; jid: string } | null>(null);
  const [checking, setChecking] = useState(false);

  // Contact details state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactDetails, setContactDetails] = useState<ContactDetails>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  // QR state
  const [qrLink, setQrLink] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await getContacts(sessionId);
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      toast.error("Erro ao carregar contatos", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleCheckPhone = useCallback(async (phone: string) => {
    if (!phone || !sessionId) return;
    setChecking(true);
    try {
      const results = await checkPhone(sessionId, [phone]);
      setCheckResult(results[0] || null);
    } catch (error) {
      console.error("Failed to check phone:", error);
      toast.error("Erro ao verificar número");
    } finally {
      setChecking(false);
    }
  }, [sessionId]);

  const handleContactClick = useCallback(async (contact: Contact) => {
    if (!sessionId) return;
    setSelectedContact(contact);
    setLoadingDetails(true);
    setContactDetails({});

    try {
      const [lidRes, businessRes, infoRes] = await Promise.allSettled([
        getContactLID(sessionId, contact.jid),
        contact.isBusiness ? getBusinessProfile(sessionId, contact.jid) : Promise.reject("Not business"),
        getContactInfo(sessionId, contact.jid),
      ]);

      setContactDetails({
        lid: lidRes.status === "fulfilled" ? lidRes.value.lid : undefined,
        profile: businessRes.status === "fulfilled" ? businessRes.value : undefined,
        avatar: infoRes.status === "fulfilled" ? (infoRes.value as any).pictureId : undefined,
      });
    } catch (error) {
      console.error("Error fetching details", error);
    } finally {
      setLoadingDetails(false);
    }
  }, [sessionId]);

  const fetchQRLink = useCallback(async () => {
    if (!sessionId) return;
    setLoadingQr(true);
    try {
      const res = await getMyContactQRLink(sessionId);
      setQrLink(res.link);
    } catch (error) {
      toast.error("Failed to get QR link");
    } finally {
      setLoadingQr(false);
    }
  }, [sessionId]);

  const filteredContacts = contacts.filter((contact) => {
    const name = contact.name || contact.pushName || contact.jid;
    const phone = contact.phone || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery)
    );
  });

  const businessCount = contacts.filter((c) => c.isBusiness).length;
  const withNameCount = contacts.filter((c) => c.name || c.pushName).length;

  return {
    // State
    contacts,
    filteredContacts,
    loading,
    searchQuery,
    setSearchQuery,

    // Stats
    businessCount,
    withNameCount,
    totalCount: contacts.length,

    // Actions
    fetchContacts,

    // Check phone
    checkResult,
    setCheckResult,
    checking,
    handleCheckPhone,

    // Contact details
    selectedContact,
    setSelectedContact,
    contactDetails,
    loadingDetails,
    handleContactClick,

    // QR
    qrLink,
    loadingQr,
    fetchQRLink,
  };
}
