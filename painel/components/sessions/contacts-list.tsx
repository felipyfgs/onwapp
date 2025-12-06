"use client"

import * as React from "react"
import { Loader2, Search, UserCheck, UserX, Users, Phone } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { Contact, CheckPhoneResult } from "@/lib/types/contact"
import { getContacts, checkPhones, getBlocklist } from "@/lib/api/contacts"

interface ContactsListProps {
  sessionId: string
}

export function ContactsList({ sessionId }: ContactsListProps) {
  const [loading, setLoading] = React.useState(true)
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [blocklist, setBlocklist] = React.useState<string[]>([])
  const [search, setSearch] = React.useState("")

  // Check phone dialog
  const [checkDialogOpen, setCheckDialogOpen] = React.useState(false)
  const [phonesToCheck, setPhonesToCheck] = React.useState("")
  const [checking, setChecking] = React.useState(false)
  const [checkResults, setCheckResults] = React.useState<CheckPhoneResult[]>([])

  const loadData = React.useCallback(async () => {
    try {
      const [contactsData, blocklistData] = await Promise.all([
        getContacts(sessionId).catch(() => []),
        getBlocklist(sessionId).catch(() => ({ blocklist: [] })),
      ])
      setContacts(contactsData)
      setBlocklist(blocklistData.blocklist || [])
    } catch (error) {
      console.error("Failed to load contacts:", error)
      toast.error("Erro ao carregar contatos")
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleCheckPhones = async () => {
    const phones = phonesToCheck
      .split("\n")
      .map((p) => p.trim().replace(/\D/g, ""))
      .filter(Boolean)

    if (phones.length === 0) {
      toast.error("Informe pelo menos um número")
      return
    }

    setChecking(true)
    try {
      const results = await checkPhones(sessionId, phones)
      setCheckResults(results)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao verificar números")
    } finally {
      setChecking(false)
    }
  }

  const filteredContacts = contacts.filter((c) => {
    const searchLower = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(searchLower) ||
      c.pushName?.toLowerCase().includes(searchLower) ||
      c.jid?.toLowerCase().includes(searchLower)
    )
  })

  const getDisplayName = (contact: Contact) => {
    return contact.name || contact.pushName || contact.businessName || contact.jid?.split("@")[0] || "Sem nome"
  }

  const getPhoneFromJid = (jid: string) => {
    return jid?.split("@")[0] || ""
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Contatos</CardTitle>
            </div>
            <Dialog open={checkDialogOpen} onOpenChange={setCheckDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4" />
                  Verificar Números
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Verificar Números</DialogTitle>
                  <DialogDescription>
                    Verifique se números de telefone estão registrados no WhatsApp.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Números (um por linha)</Label>
                    <Textarea
                      placeholder="5511999999999&#10;5511888888888"
                      value={phonesToCheck}
                      onChange={(e) => setPhonesToCheck(e.target.value)}
                      rows={4}
                    />
                  </div>
                  {checkResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {checkResults.map((result) => (
                        <div
                          key={result.phone}
                          className="flex items-center justify-between p-2 rounded border"
                        >
                          <span className="font-mono text-sm">{result.phone}</span>
                          {result.isRegistered ? (
                            <Badge variant="default" className="bg-emerald-600">
                              <UserCheck className="h-3 w-3" />
                              Registrado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <UserX className="h-3 w-3" />
                              Não encontrado
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleCheckPhones} disabled={checking} size="sm">
                    {checking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Verificar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            {contacts.length} contatos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos ({contacts.length})</TabsTrigger>
              <TabsTrigger value="blocked">Bloqueados ({blocklist.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contato..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhum contato encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContacts.slice(0, 100).map((contact) => (
                        <TableRow key={contact.jid}>
                          <TableCell className="font-medium">
                            {getDisplayName(contact)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {getPhoneFromJid(contact.jid)}
                          </TableCell>
                          <TableCell>
                            {contact.businessName ? (
                              <Badge variant="outline">Empresa</Badge>
                            ) : (
                              <Badge variant="secondary">Pessoal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredContacts.length > 100 && (
                <p className="text-sm text-muted-foreground text-center">
                  Exibindo 100 de {filteredContacts.length} contatos
                </p>
              )}
            </TabsContent>

            <TabsContent value="blocked">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Telefone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocklist.length === 0 ? (
                      <TableRow>
                        <TableCell className="text-center text-muted-foreground">
                          Nenhum contato bloqueado
                        </TableCell>
                      </TableRow>
                    ) : (
                      blocklist.map((jid) => (
                        <TableRow key={jid}>
                          <TableCell className="font-mono">
                            {getPhoneFromJid(jid)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
