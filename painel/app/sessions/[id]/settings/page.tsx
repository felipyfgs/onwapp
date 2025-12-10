"use client"

import { useEffect, useState, useCallback, use } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings, Shield, Loader2 } from "lucide-react"
import { SessionSettings, getSettings, updateSettings } from "@/lib/api/settings"

interface SettingsPageProps {
  params: Promise<{ id: string }>
}

const privacyOptions = [
  { value: "all", label: "Todos" },
  { value: "contacts", label: "Meus contatos" },
  { value: "none", label: "Ninguém" },
]

export default function SettingsPage({ params }: SettingsPageProps) {
  const { id } = use(params)

  const [settings, setSettings] = useState<SessionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSettings(id)
      setSettings(data)
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleToggle = async (key: keyof SessionSettings, value: boolean) => {
    if (!settings) return
    setUpdating(key)
    try {
      const updated = await updateSettings(id, { [key]: value })
      setSettings(updated)
    } catch (error) {
      console.error("Failed to update setting:", error)
    } finally {
      setUpdating(null)
    }
  }

  const handleSelect = async (key: keyof SessionSettings, value: string) => {
    if (!settings) return
    setUpdating(key)
    try {
      const updated = await updateSettings(id, { [key]: value })
      setSettings(updated)
    } catch (error) {
      console.error("Failed to update setting:", error)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${id}`}>{id}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Configurações</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Behavior Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Comportamento</CardTitle>
                    <CardDescription>Configure o comportamento da sessão</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="alwaysOnline">Sempre online</Label>
                    <p className="text-xs text-muted-foreground">
                      Mantém o status como online mesmo sem atividade
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "alwaysOnline" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      id="alwaysOnline"
                      checked={settings?.alwaysOnline ?? false}
                      onCheckedChange={(checked) => handleToggle("alwaysOnline", checked)}
                      disabled={updating === "alwaysOnline"}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoRejectCalls">Rejeitar chamadas</Label>
                    <p className="text-xs text-muted-foreground">
                      Rejeita automaticamente todas as chamadas recebidas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "autoRejectCalls" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      id="autoRejectCalls"
                      checked={settings?.autoRejectCalls ?? false}
                      onCheckedChange={(checked) => handleToggle("autoRejectCalls", checked)}
                      disabled={updating === "autoRejectCalls"}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="syncHistory">Sincronizar histórico</Label>
                    <p className="text-xs text-muted-foreground">
                      Sincroniza mensagens antigas ao conectar
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "syncHistory" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                      id="syncHistory"
                      checked={settings?.syncHistory ?? false}
                      onCheckedChange={(checked) => handleToggle("syncHistory", checked)}
                      disabled={updating === "syncHistory"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Privacidade</CardTitle>
                    <CardDescription>Controle quem pode ver suas informações</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Visto por último</Label>
                    <p className="text-xs text-muted-foreground">
                      Quem pode ver quando você esteve online
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "lastSeen" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Select
                      value={settings?.lastSeen ?? "all"}
                      onValueChange={(value) => handleSelect("lastSeen", value)}
                      disabled={updating === "lastSeen"}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {privacyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Online</Label>
                    <p className="text-xs text-muted-foreground">
                      Quem pode ver quando você está online
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "online" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Select
                      value={settings?.online ?? "all"}
                      onValueChange={(value) => handleSelect("online", value)}
                      disabled={updating === "online"}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {privacyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Foto do perfil</Label>
                    <p className="text-xs text-muted-foreground">
                      Quem pode ver sua foto de perfil
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "profilePhoto" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Select
                      value={settings?.profilePhoto ?? "all"}
                      onValueChange={(value) => handleSelect("profilePhoto", value)}
                      disabled={updating === "profilePhoto"}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {privacyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recado</Label>
                    <p className="text-xs text-muted-foreground">
                      Quem pode ver seu recado (about)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "status" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Select
                      value={settings?.status ?? "all"}
                      onValueChange={(value) => handleSelect("status", value)}
                      disabled={updating === "status"}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {privacyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmação de leitura</Label>
                    <p className="text-xs text-muted-foreground">
                      Enviar confirmação quando ler mensagens
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "readReceipts" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Select
                      value={settings?.readReceipts ?? "all"}
                      onValueChange={(value) => handleSelect("readReceipts", value)}
                      disabled={updating === "readReceipts"}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {privacyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Adicionar em grupos</Label>
                    <p className="text-xs text-muted-foreground">
                      Quem pode adicionar você a grupos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {updating === "groupAdd" && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Select
                      value={settings?.groupAdd ?? "all"}
                      onValueChange={(value) => handleSelect("groupAdd", value)}
                      disabled={updating === "groupAdd"}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {privacyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
