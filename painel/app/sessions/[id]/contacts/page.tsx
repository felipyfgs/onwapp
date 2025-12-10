"use client"

import { useEffect, useState, useCallback, use, useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  ContactList,
  ContactFilters,
  ContactEmptyState,
  ContactSkeleton,
  type ContactFilterType,
} from "@/components/contacts"
import { Contact, getContacts } from "@/lib/api/contacts"

interface ContactsPageProps {
  params: Promise<{ id: string }>
}

export default function ContactsPage({ params }: ContactsPageProps) {
  const { id } = use(params)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ContactFilterType>("all")

  const fetchContacts = useCallback(async () => {
    try {
      const data = await getContacts(id)
      setContacts(data || [])
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
      setContacts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchContacts()
  }

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        !search ||
        contact.name?.toLowerCase().includes(search.toLowerCase()) ||
        contact.pushName?.toLowerCase().includes(search.toLowerCase()) ||
        contact.businessName?.toLowerCase().includes(search.toLowerCase()) ||
        contact.phone?.includes(search) ||
        contact.jid?.includes(search)

      const matchesFilter =
        filter === "all" ||
        (filter === "business" && contact.isBusiness) ||
        (filter === "personal" && !contact.isBusiness)

      return matchesSearch && matchesFilter
    })
  }, [contacts, search, filter])

  const stats = useMemo(() => {
    const total = contacts.length
    const business = contacts.filter((c) => c.isBusiness).length
    const personal = total - business
    return { total, business, personal }
  }, [contacts])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Contatos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <ContactFilters
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          stats={stats}
        />

        {loading ? (
          <ContactSkeleton />
        ) : filteredContacts.length === 0 ? (
          <ContactEmptyState hasFilters={!!search || filter !== "all"} />
        ) : (
          <>
            <ContactList contacts={filteredContacts} />
            <p className="text-sm text-muted-foreground text-center">
              Mostrando {filteredContacts.length} de {stats.total} contatos
            </p>
          </>
        )}
      </div>
    </>
  )
}
