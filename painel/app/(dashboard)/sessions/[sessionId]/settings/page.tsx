"use client"

import { useState, useEffect, use } from "react"
import { Loader2, Settings, Save, User, Shield, Clock } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionProfile } from "@/lib/api/sessions"

interface SessionSettings {
  alwaysOnline?: boolean
  autoRejectCalls?: boolean
  ephemeralDuration?: number
}

interface Profile {
  phone?: string
  pushName?: string
  status?: string
}

export default function SettingsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [profile, setProfile] = useState<Profile>({})
  const [settings, setSettings] = useState<SessionSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const profileData = await getSessionProfile(sessionId)
        setProfile(profileData)
      } catch (err) {
        // Profile pode falhar se sessao desconectada
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      // TODO: Implementar save settings quando API estiver pronta
      setSuccess('Configuracoes salvas!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessoes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Configuracoes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="size-6" />
            Configuracoes
          </h1>
          <p className="text-muted-foreground">
            Configuracoes da sessao {sessionId}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Perfil
              </CardTitle>
              <CardDescription>
                Informacoes do perfil WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={profile.phone || '-'} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input value={profile.pushName || '-'} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Input value={profile.status || '-'} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Privacidade
              </CardTitle>
              <CardDescription>
                Configuracoes de privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sempre Online</p>
                  <p className="text-sm text-muted-foreground">Manter status online</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.alwaysOnline || false}
                  onChange={(e) => setSettings({ ...settings, alwaysOnline: e.target.checked })}
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rejeitar Chamadas</p>
                  <p className="text-sm text-muted-foreground">Rejeitar chamadas automaticamente</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoRejectCalls || false}
                  onChange={(e) => setSettings({ ...settings, autoRejectCalls: e.target.checked })}
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Mensagens Temporarias
              </CardTitle>
              <CardDescription>
                Configurar mensagens que desaparecem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duracao padrao</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={settings.ephemeralDuration || 0}
                  onChange={(e) => setSettings({ ...settings, ephemeralDuration: parseInt(e.target.value) })}
                >
                  <option value={0}>Desativado</option>
                  <option value={86400}>24 horas</option>
                  <option value={604800}>7 dias</option>
                  <option value={7776000}>90 dias</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>
    </>
  )
}
