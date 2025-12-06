"use client"

import * as React from "react"
import { Loader2, Save, Settings } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

import type { Settings as SettingsType, UpdateSettingsRequest } from "@/lib/types/settings"
import { PRIVACY_OPTIONS, DISAPPEARING_TIMER_OPTIONS } from "@/lib/types/settings"
import { getSettings, updateSettings } from "@/lib/api/settings"

interface SettingsConfigProps {
  sessionId: string
}

export function SettingsConfig({ sessionId }: SettingsConfigProps) {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [settings, setSettings] = React.useState<SettingsType | null>(null)

  // Local settings
  const [alwaysOnline, setAlwaysOnline] = React.useState(false)
  const [autoRejectCalls, setAutoRejectCalls] = React.useState(false)
  const [syncHistory, setSyncHistory] = React.useState(false)

  // Privacy settings
  const [lastSeen, setLastSeen] = React.useState("all")
  const [online, setOnline] = React.useState("all")
  const [profilePhoto, setProfilePhoto] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [readReceipts, setReadReceipts] = React.useState("all")
  const [groupAdd, setGroupAdd] = React.useState("all")
  const [callAdd, setCallAdd] = React.useState("all")
  const [disappearingTimer, setDisappearingTimer] = React.useState("off")

  const loadSettings = React.useCallback(async () => {
    try {
      const data = await getSettings(sessionId)
      setSettings(data)
      setAlwaysOnline(data.alwaysOnline)
      setAutoRejectCalls(data.autoRejectCalls)
      setSyncHistory(data.syncHistory)
      setLastSeen(data.lastSeen)
      setOnline(data.online)
      setProfilePhoto(data.profilePhoto)
      setStatus(data.status)
      setReadReceipts(data.readReceipts)
      setGroupAdd(data.groupAdd)
      setCallAdd(data.callAdd)
      setDisappearingTimer(data.defaultDisappearingTimer)
    } catch (error) {
      console.error("Failed to load settings:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: UpdateSettingsRequest = {
        alwaysOnline,
        autoRejectCalls,
        syncHistory,
        lastSeen,
        online,
        profilePhoto,
        status,
        readReceipts,
        groupAdd,
        callAdd,
        defaultDisappearingTimer: disappearingTimer,
      }
      await updateSettings(sessionId, data)
      toast.success("Configurações salvas!")
      loadSettings()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Local Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Configurações Gerais</CardTitle>
          </div>
          <CardDescription>
            Configurações locais da sessão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Sempre Online</Label>
              <p className="text-xs text-muted-foreground">Manter status online mesmo inativo</p>
            </div>
            <Switch checked={alwaysOnline} onCheckedChange={setAlwaysOnline} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Rejeitar Chamadas</Label>
              <p className="text-xs text-muted-foreground">Rejeitar automaticamente chamadas recebidas</p>
            </div>
            <Switch checked={autoRejectCalls} onCheckedChange={setAutoRejectCalls} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Sincronizar Histórico</Label>
              <p className="text-xs text-muted-foreground">Sincronizar mensagens antigas ao conectar</p>
            </div>
            <Switch checked={syncHistory} onCheckedChange={setSyncHistory} />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacidade</CardTitle>
          <CardDescription>
            Quem pode ver suas informações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Visto por último</Label>
              <Select value={lastSeen} onValueChange={setLastSeen}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Online</Label>
              <Select value={online} onValueChange={setOnline}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <Select value={profilePhoto} onValueChange={setProfilePhoto}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Confirmação de Leitura</Label>
              <Select value={readReceipts} onValueChange={setReadReceipts}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Adicionar em Grupos</Label>
              <Select value={groupAdd} onValueChange={setGroupAdd}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Adicionar em Chamadas</Label>
              <Select value={callAdd} onValueChange={setCallAdd}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mensagens Temporárias</Label>
              <Select value={disappearingTimer} onValueChange={setDisappearingTimer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISAPPEARING_TIMER_OPTIONS.map((opt) => (
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

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
