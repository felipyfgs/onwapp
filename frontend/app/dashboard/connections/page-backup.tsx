"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  QrCode, 
  Activity, 
  Wifi, 
  Power,
  RefreshCw,
  Trash2,
  Plus
} from "lucide-react"
// import { apiClient } from "@/lib/api/client"

interface WhatsAppSession {
  id: string
  name: string
  status: "connected" | "disconnected" | "connecting"
  qr_code?: string
  created_at: string
}

export default function ConnectionsPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [currentSession, setCurrentSession] = useState<WhatsAppSession | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      // Mock data enquanto não temos endpoint específico
      // const response = await apiClient.get('/api/v1/sessions')
      
      setSessions([
        {
          id: "1",
          name: "Atendimento Principal",
          status: "connected",
          created_at: "2024-12-18T10:00:00Z"
        },
        {
          id: "2",
          name: "Vendas",
          status: "disconnected",
          created_at: "2024-12-17T15:00:00Z"
        }
      ])
    } catch (error) {
      console.error("Erro ao carregar sessões:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500">Conectado</Badge>
      case "disconnected":
        return <Badge className="bg-red-500">Desconectado</Badge>
      case "connecting":
        return <Badge className="bg-yellow-500">Conectando</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleConnect = (session: WhatsAppSession) => {
    setCurrentSession(session)
    setShowQRModal(true)
    // Aqui você iniciaria o processo de conexão WhatsApp
    // O QR code seria gerado pelo backend via NATS ou API
  }

  const handleDisconnect = async (id: string) => {
    if (confirm("Tem certeza que deseja desconectar esta sessão?")) {
      try {
        // await apiClient.post(`/api/v1/sessions/${id}/disconnect`)
        await loadSessions()
      } catch (error) {
        console.error("Erro ao desconectar:", error)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta sessão?")) {
      try {
        // await apiClient.delete(`/api/v1/sessions/${id}`)
        setSessions(prev => prev.filter(s => s.id !== id))
      } catch (error) {
        console.error("Erro ao excluir:", error)
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
          <h2 className="text-lg font-semibold">Conexões WhatsApp</h2>
          <p className="text-xs text-muted-foreground">Gerencie suas conexões WhatsApp</p>
        </div>
        <Button size="sm" onClick={async () => {
          try {
            // await apiClient.post("/api/v1/sessions", { name: "Nova Conexão" })
            await loadSessions()
          } catch (error) {
            console.error("Erro ao criar sessão:", error)
          }
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{session.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(session.status)}
                      {session.status === "connected" && (
                        <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Criada em: {new Date(session.created_at).toLocaleDateString("pt-BR")}
                </p>

                <div className="flex gap-2">
                  {session.status === "disconnected" && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleConnect(session)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  )}
                  {session.status === "connected" && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDisconnect(session.id)}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDelete(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {session.status === "connected" && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Wifi className="h-3 w-3" />
                    Sinal forte - Pronto para mensagens
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma conexão</p>
              <p className="text-muted-foreground">Crie sua primeira conexão WhatsApp</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Cards - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Conectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.status === "connected").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Desconectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.status === "disconnected").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal */}
      {showQRModal && currentSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Conectar {currentSession.name}</CardTitle>
              <CardDescription>
                Escaneie o QR code com o WhatsApp do celular
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-300">
                  QR Code Aqui
                  {/* Aqui seria o QR code real */}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Vá em Configurações → Dispositivos conectados</p>
                <p>3. Toque em "Conectar um dispositivo"</p>
                <p>4. Escaneie este QR code</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowQRModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={async () => {
                    // Iniciar verificação de conexão
                    setShowQRModal(false)
                    await loadSessions()
                  }}
                >
                  Verificar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
