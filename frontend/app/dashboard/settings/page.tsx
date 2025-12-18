"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Shield, 
  Bell, 
  Database,
  Save,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Simular chamada API
      // await apiClient.put("/api/v1/users/profile", data)
      
      setSuccess("Perfil atualizado com sucesso!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Erro ao atualizar perfil")
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.target as HTMLFormElement)
    const newPassword = formData.get("new_password") as string
    const confirmPassword = formData.get("confirm_password") as string

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem")
      setSaving(false)
      return
    }

    try {
      // await apiClient.put("/api/v1/users/password", { password: newPassword })
      
      setSuccess("Senha alterada com sucesso!")
      setTimeout(() => setSuccess(null), 3000)
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setError("Erro ao alterar senha")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Configurações</h2>
        <p className="text-xs text-muted-foreground">Gerencie suas preferências e segurança</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="h-4 w-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={user?.name} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      defaultValue={user?.email} 
                      disabled 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa (Tenant)</Label>
                  <Input 
                    id="company" 
                    name="company" 
                    placeholder="Nome da empresa" 
                    defaultValue={user?.tenant_id || ""}
                    disabled
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Alterar senha e preferências de segurança</CardDescription>
            </CardHeader>
            <CardContent>
              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nova Senha</Label>
                  <Input 
                    id="new_password" 
                    name="new_password" 
                    type="password" 
                    placeholder="••••••••"
                    minLength={8}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirm_password" 
                    name="confirm_password" 
                    type="password" 
                    placeholder="••••••••"
                    minLength={8}
                    required 
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Sessões Ativas</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span>Este dispositivo (Linux - Chrome)</span>
                    </div>
                    <span className="text-xs">Ativo agora</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Gerencie como você recebe alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Novos Tickets</p>
                  <p className="text-sm text-muted-foreground">Notificar quando novos tickets chegarem</p>
                </div>
                <Button variant="outline" size="sm">Ativar</Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Mensagens não lidas</p>
                  <p className="text-sm text-muted-foreground">Alertas para mensagens pendentes</p>
                </div>
                <Button variant="outline" size="sm">Ativar</Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Conexão WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Status das conexões</p>
                </div>
                <Button variant="outline" size="sm">Ativar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
              <CardDescription>Detalhes sobre o ambiente e tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground mb-1">Versão</p>
                  <p className="font-medium">v1.0.0</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground mb-1">Ambiente</p>
                  <p className="font-medium">Desenvolvimento</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground mb-1">Tenant ID</p>
                  <p className="font-medium text-xs break-all">{user?.tenant_id || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground mb-1">User ID</p>
                  <p className="font-medium text-xs">{user?.id || "N/A"}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Ações</h4>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    // Limpar cache
                    localStorage.clear()
                    window.location.reload()
                  }}>
                    Limpar Cache
                  </Button>
                  <Button variant="destructive" onClick={logout}>
                    Sair da Conta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
