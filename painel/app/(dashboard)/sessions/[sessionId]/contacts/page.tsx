"use client"

import { useState, useEffect, use } from "react"
import { Users, User, Search, Phone, Building2, QrCode, Ban } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ContactsSkeleton, 
  ContactDetailsDialog, 
  CheckPhoneDialog, 
  QRLinkDialog,
  BlocklistTab,
} from "@/components/contacts"
import { getContacts, getBlocklist, type Contact } from "@/lib/api/contacts"

export default function ContactsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [blockedJids, setBlockedJids] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)

  const loadData = async () => {
    try {
      const [contactsData, blocklistData] = await Promise.all([
        getContacts(sessionId),
        getBlocklist(sessionId).catch(() => []),
      ])
      setContacts(contactsData)
      setBlockedJids(blocklistData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
      return jidParts[0]
    }
    return jidParts[0]
  }

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact)
    setDetailsOpen(true)
  }

  const handleBlocklistChange = () => {
    getBlocklist(sessionId).then(setBlockedJids).catch(() => {})
  }

  const headerContent = (
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
  )

  if (loading) {
    return (
      <>
        {headerContent}
        <ContactsSkeleton />
      </>
    )
  }

  return (
    <>
      {headerContent}

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="size-6" />
              Contatos
            </h1>
            <p className="text-muted-foreground">
              {contacts.length} contatos
              {blockedJids.length > 0 && ` · ${blockedJids.length} bloqueados`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCheckOpen(true)}>
              <Search className="size-4 mr-1.5" />
              Verificar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
              <QrCode className="size-4 mr-1.5" />
              Meu QR
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex items-center gap-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5">
                <Users className="size-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="blocked" className="gap-1.5">
                <Ban className="size-4" />
                Bloqueados
                {blockedJids.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{blockedJids.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contato..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="size-12 mb-4" />
                <p>{search ? 'Nenhum contato encontrado' : 'Nenhum contato'}</p>
              </div>
            ) : (
              <div className="rounded-lg border divide-y">
                {filteredContacts.map((contact) => {
                  const isBlocked = blockedJids.includes(contact.jid)
                  return (
                    <div
                      key={contact.jid}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleContactClick(contact)}
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
                            <Badge variant="secondary" className="shrink-0 text-xs">Business</Badge>
                          )}
                          {isBlocked && (
                            <Badge variant="destructive" className="shrink-0 text-xs">Bloqueado</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="size-3" />
                          <span>+{getPhone(contact)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blocked" className="mt-0">
            <BlocklistTab
              sessionId={sessionId}
              blockedJids={blockedJids}
              onUnblock={handleBlocklistChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ContactDetailsDialog
        sessionId={sessionId}
        contact={selectedContact}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        blockedJids={blockedJids}
        onBlocklistChange={handleBlocklistChange}
      />

      <CheckPhoneDialog
        sessionId={sessionId}
        open={checkOpen}
        onOpenChange={setCheckOpen}
      />

      <QRLinkDialog
        sessionId={sessionId}
        open={qrOpen}
        onOpenChange={setQrOpen}
      />
    </>
  )
}
