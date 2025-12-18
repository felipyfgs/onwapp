"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  User, 
  Phone, 
  Plus, 
  MoreVertical,
  Trash2,
  Edit2
} from "lucide-react"
// import { apiClient } from "@/lib/api/client"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface Contact {
  id: string
  name: string
  phone_number: string
  whatsapp_id: string
  is_group: boolean
  created_at: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      // Mock data enquanto não temos endpoint específico
      // const response = await apiClient.get('/api/v1/contacts')
      
      setContacts([
        {
          id: "1",
          name: "João Silva",
          phone_number: "+55 11 99999-9999",
          whatsapp_id: "5511999999999@s.whatsapp.net",
          is_group: false,
          created_at: "2024-12-18T10:00:00Z"
        },
        {
          id: "2",
          name: "Maria Santos",
          phone_number: "+55 11 88888-8888",
          whatsapp_id: "5511888888888@s.whatsapp.net",
          is_group: false,
          created_at: "2024-12-18T09:30:00Z"
        },
        {
          id: "3",
          name: "Grupo Vendas",
          phone_number: "+55 11 77777-7777",
          whatsapp_id: "5511777777777@g.us",
          is_group: true,
          created_at: "2024-12-17T15:00:00Z"
        }
      ])
    } catch (error) {
      console.error("Erro ao carregar contatos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.phone_number.includes(search)
  )

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este contato?")) {
      try {
        // await apiClient.delete(`/api/v1/contacts/${id}`)
        setContacts(prev => prev.filter(c => c.id !== id))
      } catch (error) {
        console.error("Erro ao excluir contato:", error)
      }
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
          <h2 className="text-lg font-semibold">Contatos</h2>
          <p className="text-xs text-muted-foreground">Gerencie sua lista de contatos WhatsApp</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum contato encontrado</p>
            <p className="text-muted-foreground">Não há contatos correspondentes à sua busca</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      contact.is_group ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <Badge variant={contact.is_group ? "secondary" : "outline"} className="text-xs">
                        {contact.is_group ? "Grupo" : "Individual"}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-600"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {contact.phone_number}
                  </div>
                  <div className="text-xs">
                    Criado em: {new Date(contact.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Individual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.filter(c => !c.is_group).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.filter(c => c.is_group).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Modal - Simplified (you can enhance this later) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Novo Contato</CardTitle>
              <CardDescription>Cadastrar contato WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const data = {
                  name: formData.get("name"),
                  phone_number: formData.get("phone"),
                  whatsapp_id: formData.get("whatsapp_id")
                }
                try {
                  // await apiClient.post("/api/v1/contacts", data)
                  await loadContacts()
                  setShowCreateModal(false)
                } catch (error) {
                  console.error("Erro ao criar:", error)
                }
              }}>
                <Input name="name" placeholder="Nome completo" required />
                <Input name="phone" placeholder="Telefone (ex: +55 11 99999-9999)" required />
                <Input name="whatsapp_id" placeholder="WhatsApp ID (ex: 5511999999999@s.whatsapp.net)" required />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
