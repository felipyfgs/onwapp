"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, User, Clock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { ticketsApi, type Ticket } from "@/lib/api/tickets"
import { contactsApi, type Contact } from "@/lib/api/contacts"

export default function ChatsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [contacts, setContacts] = useState<Map<string, Contact>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [ticketsResponse, contactsResponse] = await Promise.all([
        ticketsApi.list(),
        contactsApi.list()
      ])
      
      const contactsMap = new Map<string, Contact>()
      contactsResponse.forEach(c => contactsMap.set(c.id, c))
      
      setTickets(ticketsResponse)
      setContacts(contactsMap)
    } catch (error: any) {
      const message = error.response?.data?.error || "Erro ao carregar dados"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (!search) return true
    const contact = contacts.get(ticket.contact_id)
    return contact?.name.toLowerCase().includes(search.toLowerCase()) ||
           contact?.phone_number.includes(search)
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Aberto</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>
      case "closed":
        return <Badge className="bg-gray-500">Fechado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Chats Ativos</h2>
          <p className="text-xs text-muted-foreground">Gerencie seus tickets de atendimento</p>
        </div>
        <Button size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por contato ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        /* Tickets List */
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const contact = contacts.get(ticket.contact_id)
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {contact?.name || "Desconhecido"}
                          </span>
                          {ticket.unread_messages && (
                            <Badge className="bg-red-500 h-5">Novo</Badge>
                          )}
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {contact?.phone_number || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {ticket.last_message_at ? 
                            new Date(ticket.last_message_at).toLocaleString("pt-BR") : 
                            "Sem mensagens"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Abrir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredTickets.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum ticket encontrado</p>
                <p className="text-sm text-muted-foreground">
                  {search ? "Não há tickets correspondentes à busca" : "Não há tickets ativos no momento"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === "open").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
