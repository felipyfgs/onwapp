"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  User, 
  Phone, 
  Plus, 
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Groups
} from "lucide-react"
import { contactsApi, type Contact } from "@/lib/api/contacts"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await contactsApi.list()
      setContacts(response)
    } catch (error: any) {
      const message = error.response?.data?.error || "Erro ao carregar contatos"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setError(null)
    
    const formData = new FormData(e.target as HTMLFormElement)
    const data = {
      name: formData.get("name") as string,
      phone_number: formData.get("phone_number") as string,
      whatsapp_id: formData.get("whatsapp_id") as string,
      is_group: formData.get("is_group") === "true"
    }

    try {
      const newContact = await contactsApi.create(data)
      setContacts(prev => [...prev, newContact])
      setShowCreateModal(false)
      setSuccess("Contato criado com sucesso!")
      setTimeout(() => setSuccess(null), 3000)
      ;(e.target as HTMLFormElement).reset()
    } catch (error: any) {
      const message = error.response?.data?.error || "Erro ao criar contato"
      setError(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este contato?")) return

    setActionLoading(true)
    setError(null)

    try {
      await contactsApi.delete(id)
      setSuccess("Contato excluído com sucesso!")
      setContacts(prev => prev.filter(c => c.id !== id))
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      const message = error.response?.data?.error || "Erro ao excluir"
      setError(message)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.phone_number.includes(search) ||
    contact.whatsapp_id.includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Contatos</h2>
          <p className="text-xs text-muted-foreground">Gerencie sua lista de contatos WhatsApp</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)} disabled={actionLoading}>
          {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Novo Contato
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou WhatsApp ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        /* Contacts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      contact.is_group ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {contact.is_group ? <Groups className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{contact.name}</p>
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
                        disabled={actionLoading}
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
                  <div className="text-xs font-mono">
                    {contact.whatsapp_id}
                  </div>
                  <div className="text-xs">
                    Criado: {new Date(contact.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredContacts.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum contato encontrado</p>
                <p className="text-sm text-muted-foreground">
                  {search ? "Não há contatos correspondentes à busca" : "Não há contatos cadastrados"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && (
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
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Novo Contato</CardTitle>
              <CardDescription>Cadastrar contato WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateContact} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Nome completo"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Telefone *</Label>
                  <Input 
                    id="phone_number" 
                    name="phone_number" 
                    placeholder="+55 11 99999-9999"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_id">WhatsApp ID</Label>
                  <Input 
                    id="whatsapp_id" 
                    name="whatsapp_id" 
                    placeholder="5511999999999@s.whatsapp.net"
                    required 
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="is_group" 
                    name="is_group" 
                    value="true"
                    className="h-4 w-4" 
                  />
                  <Label htmlFor="is_group">É um grupo</Label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                    disabled={actionLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Criar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
