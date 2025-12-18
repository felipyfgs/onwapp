"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Users, 
  Activity, 
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

interface DashboardStats {
  totalTickets: number
  openTickets: number
  pendingTickets: number
  totalContacts: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setStats({
        totalTickets: 45,
        openTickets: 12,
        pendingTickets: 8,
        totalContacts: 128,
        recentActivity: [
          { id: "1", type: "ticket", description: "Novo ticket aberto por João Silva", timestamp: "2 min atrás" },
          { id: "2", type: "contact", description: "Contato Maria Santos adicionado", timestamp: "5 min atrás" },
          { id: "3", type: "ticket", description: "Ticket #1234 resolvido", timestamp: "15 min atrás" },
        ]
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Welcome and Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bem-vindo, {user?.name || "Usuário"}!</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Atualizar</Button>
          <Button variant="destructive" size="sm" onClick={handleLogout}>Sair</Button>
        </div>
      </div>

      {/* Stats Cards - Compact Layout like Template */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Totais</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTickets || 0}</div>
            <p className="text-xs text-muted-foreground">+3 desde ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground">Atividade recente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingTickets || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
            <p className="text-xs text-muted-foreground">Total de clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                  {activity.type === "ticket" ? (
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  ) : activity.type === "contact" ? (
                    <Users className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Atalhos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/dashboard/chats">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Chats</span>
              </Button>
            </Link>
            <Link href="/dashboard/contacts">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                <Users className="h-5 w-5" />
                <span className="text-xs">Contatos</span>
              </Button>
            </Link>
            <Link href="/dashboard/connections">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                <Activity className="h-5 w-5" />
                <span className="text-xs">Conexões</span>
              </Button>
            </Link>
            <Link href="/dashboard/queues">
              <Button variant="outline" className="w-full h-16 flex flex-col gap-1">
                <Clock className="h-5 w-5" />
                <span className="text-xs">Filas</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
