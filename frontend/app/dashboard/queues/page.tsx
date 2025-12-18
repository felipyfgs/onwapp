"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  MoreVertical,
  Trash2,
  Edit2,
  Users,
  Clock,
  Settings
} from "lucide-react"
// import { apiClient } from "@/lib/api/client"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface Queue {
  id: string
  name: string
  color: string
  greeting_message: string
  order_num: number
  created_at: string
}

export default function QueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadQueues()
  }, [])

  const loadQueues = async () => {
    try {
      // Mock data enquanto não temos endpoint específico
      // const response = await apiClient.get('/api/v1/queues')
      
      setQueues([
        {
          id: "1",
          name: "Vendas",
          color: "#10b981",
          greeting_message: "Olá! Você está conectado com nosso time de vendas. Como podemos ajudar?",
          order_num: 1,
          created_at: "2024-12-18T10:00:00Z"
        },
        {
          id: "2",
          name: "Suporte Técnico",
          color: "#3b82f6",
          greeting_message: "Olá! Suporte técnico aqui. Qual é o seu problema?",
          order_num: 2,
          created_at: "2024-12-18T09:30:00Z"
        },
        {
          id: "3",
          name: "Financeiro",
          color: "#f59e0b",
          greeting_message: "Olá! Departamento financeiro. Como posso ajudar?",
          order_num: 3,
          created_at: "2024-12-17T14:00:00Z"
        }
      ])
    } catch (error) {
      console.error("Erro ao carregar filas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta fila?")) {
      try {
        // await apiClient.delete(`/api/v1/queues/${id}`)
        setQueues(prev => prev.filter(q => q.id !== id))
      } catch (error) {
        console.error("Erro ao excluir fila:", error)
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
          <h2 className="text-lg font-semibold">Filas de Atendimento</h2>
          <p className="text-xs text-muted-foreground">Gerencie as filas de distribuição de tickets</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fila
        </Button>
      </div>

      {/* Queues List */}
      {queues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma fila encontrada</p>
            <p className="text-muted-foreground">Crie sua primeira fila de atendimento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queues.map((queue) => (
            <Card key={queue.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: queue.color }}
                      />
                      <h3 className="font-semibold text-lg">{queue.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        Ordem: {queue.order_num}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {queue.greeting_message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {Math.floor(Math.random() * 20)} tickets
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(queue.created_at).toLocaleDateString("pt-BR")}
                      </span>
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
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-red-600"
                        onClick={() => handleDelete(queue.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Filas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickets em Fila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queues.length * 5}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Nova Fila</CardTitle>
              <CardDescription>Criar nova fila de atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const data = {
                  name: formData.get("name"),
                  color: formData.get("color") || "#3b82f6",
                  greeting_message: formData.get("greeting_message"),
                  order_num: parseInt(formData.get("order_num") as string) || queues.length + 1
                }
                try {
                  // await apiClient.post("/api/v1/queues", data)
                  await loadQueues()
                  setShowCreateModal(false)
                } catch (error) {
                  console.error("Erro ao criar:", error)
                }
              }}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Fila</label>
                  <Input name="name" placeholder="Ex: Vendas, Suporte" required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex gap-2">
                    <Input 
                      name="color" 
                      type="color" 
                      defaultValue="#3b82f6" 
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      placeholder="#3b82f6" 
                      defaultValue="#3b82f6"
                      onChange={(e) => {
                        const input = e.target.parentElement?.querySelector('input[type="color"]') as HTMLInputElement
                        if (input) input.value = e.target.value
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
                  <Textarea 
                    name="greeting_message" 
                    placeholder="Olá! Como podemos ajudar?"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordem de Exibição</label>
                  <Input 
                    name="order_num" 
                    type="number" 
                    defaultValue={queues.length + 1}
                    min={1}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Criar Fila
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
