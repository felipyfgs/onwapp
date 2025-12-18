"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, User, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
// import { apiClient } from "@/lib/api/client"

interface Ticket {
  id: string
  contact_id: string
  status: string
  unread_messages: boolean
  last_message_at: string
  contact_name?: string
  contact_phone?: string
}

export default function ChatsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      // Mock data enquanto não temos endpoint específico
      // const response = await apiClient.get('/api/v1/tickets')
      
      // Simular dados
      setTickets([
        {
          id: "1",
          contact_id: "c1",
          status: "open",
          unread_messages: true,
          last_message_at: "2024-12-18T11:00:00Z",
          contact_name: "João Silva",
          contact_phone: "+55 11 99999-9999"
        },
        {
          id: "2",
          contact_id: "c2",
          status: "pending",
          unread_messages: false,
          last_message_at: "2024-12-18T10:30:00Z",
          contact_name: "Maria Santos",
          contact_phone: "+55 11 88888-8888"
        },
        {
          id: "3",
          contact_id: "c3",
          status: "open",
          unread_messages: false,
          last_message_at: "2024-12-18T09:15:00Z",
          contact_name: "Pedro Costa",
          contact_phone: "+55 11 77777-7777"
        }
      ])
    } catch (error) {
      console.error("Erro ao carregar tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => 
    ticket.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    ticket.contact_phone?.includes(search)
  )

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Chats Ativos</h2>
          <p className="text-xs text-muted-foreground">Gerencie seus tickets de atendimento</p>
        </div>
        <Button size="sm">Novo Ticket</Button>
      </div>

      {/* Search Bar */}
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

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum ticket encontrado</p>
              <p className="text-muted-foreground">Não há tickets correspondentes à sua busca</p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{ticket.contact_name}</span>
                        {ticket.unread_messages && (
                          <Badge className="bg-red-500 h-5">Novo</Badge>
                        )}
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{ticket.contact_phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(ticket.last_message_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Abrir Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === "open").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.filter(t => t.status === "pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
