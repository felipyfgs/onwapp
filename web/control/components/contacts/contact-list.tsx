"use client"

import { useEffect, useState, useMemo } from "react"
import { Users, RefreshCw } from "lucide-react"

import { Contact, getContacts, updateBlocklist } from "@/lib/api/contacts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { LoadingList } from "@/components/loading-state"
import { ContactItem } from "./contact-item"

interface ContactListProps {
  sessionId: string
}

export function ContactList({ sessionId }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  async function fetchContacts() {
    setLoading(true)
    setError(null)
    const response = await getContacts(sessionId)
    if (response.success && response.data) {
      setContacts(response.data)
    } else {
      setError(response.error || "Failed to fetch contacts")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchContacts()
  }, [sessionId])

  async function handleBlock(contact: Contact) {
    const response = await updateBlocklist(sessionId, contact.jid, "block")
    if (response.success) {
      setContacts((prev) => prev.map((c) => (c.jid === contact.jid ? { ...c, isBlocked: true } : c)))
    }
  }

  async function handleUnblock(contact: Contact) {
    const response = await updateBlocklist(sessionId, contact.jid, "unblock")
    if (response.success) {
      setContacts((prev) => prev.map((c) => (c.jid === contact.jid ? { ...c, isBlocked: false } : c)))
    }
  }

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts
    const searchLower = search.toLowerCase()
    return contacts.filter(
      (contact) =>
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.pushName?.toLowerCase().includes(searchLower) ||
        contact.jid.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower)
    )
  }, [contacts, search])

  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      const nameA = a.name || a.pushName || a.jid
      const nameB = b.name || b.pushName || b.jid
      return nameA.localeCompare(nameB)
    })
  }, [filteredContacts])

  if (loading) return <LoadingList count={5} />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchContacts}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Button variant="outline" size="icon" onClick={fetchContacts}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {sortedContacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No contacts found" : "No contacts yet"}
          description={search ? "Try a different search term" : "Connect your session to sync your contacts."}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {sortedContacts.length} contact{sortedContacts.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}
          </p>
          <div className="space-y-2">
            {sortedContacts.map((contact) => (
              <ContactItem key={contact.jid} contact={contact} onBlock={handleBlock} onUnblock={handleUnblock} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
