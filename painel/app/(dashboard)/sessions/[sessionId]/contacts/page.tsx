"use client"

import { useState, useEffect, use } from "react"
import { Loader2, Users, User, Search, Phone, Building2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { getContacts, type Contact } from "@/lib/api/contacts"

export default function ContactsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const data = await getContacts(sessionId)
        setContacts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const filteredContacts = contacts.filter(contact => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      contact.pushName?.toLowerCase().includes(searchLower) ||
      contact.fullName?.toLowerCase().includes(searchLower) ||
      contact.businessName?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(search) ||
      contact.jid.includes(search)
    )
  })

  const getDisplayName = (contact: Contact) => {
    return contact.fullName || contact.pushName || contact.businessName || contact.phone || contact.jid.split('@')[0]
  }

  const getPhone = (contact: Contact) => {
    if (contact.phone) return contact.phone
    const jidParts = contact.jid.split('@')
    if (jidParts[1] === 's.whatsapp.net') {
      return '+' + jidParts[0]
    }
    return jidParts[0]
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessoes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Contatos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="size-6" />
              Contatos
            </h1>
            <p className="text-muted-foreground">
              {contacts.length} contatos
            </p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="size-12 mb-4" />
            <p>{search ? 'Nenhum contato encontrado' : 'Nenhum contato'}</p>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {filteredContacts.map((contact) => (
              <div
                key={contact.jid}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  {contact.businessName ? (
                    <Building2 className="size-5 text-muted-foreground" />
                  ) : (
                    <User className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{getDisplayName(contact)}</span>
                    {contact.businessName && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        Business
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="size-3" />
                    <span>{getPhone(contact)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
