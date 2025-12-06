"use client"

import * as React from "react"
import { Camera, Loader2, Save, Trash2, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type { Profile } from "@/lib/types/profile"
import {
  getProfile,
  setName,
  setStatus,
  setPicture,
  removePicture,
} from "@/lib/api/profile"

interface ProfileConfigProps {
  sessionId: string
}

export function ProfileConfig({ sessionId }: ProfileConfigProps) {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [removingPicture, setRemovingPicture] = React.useState(false)
  const [profile, setProfile] = React.useState<Profile | null>(null)

  const [name, setNameValue] = React.useState("")
  const [status, setStatusValue] = React.useState("")

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const loadProfile = React.useCallback(async () => {
    try {
      const response = await getProfile(sessionId)
      setProfile(response.profile)
      setNameValue(response.profile.pushName || "")
      setStatusValue(response.profile.status || "")
    } catch (err) {
      // Handle error without re-throwing to avoid Next.js error overlay
      const message = err instanceof Error ? err.message : "Erro ao carregar perfil"
      if (message.includes("not authenticated") || message.includes("not connected")) {
        toast.error("Sessão não conectada. Conecte a sessão primeiro.")
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    setSaving(true)
    try {
      await setName(sessionId, name.trim())
      toast.success("Nome atualizado!")
      loadProfile()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar nome")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStatus = async () => {
    setSaving(true)
    try {
      await setStatus(sessionId, status.trim())
      toast.success("Status atualizado!")
      loadProfile()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar status")
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 5MB)")
      return
    }

    setSaving(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1]
        await setPicture(sessionId, base64)
        toast.success("Foto atualizada!")
        loadProfile()
        setSaving(false)
      }
      reader.onerror = () => {
        toast.error("Erro ao ler arquivo")
        setSaving(false)
      }
      reader.readAsDataURL(file)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar foto")
      setSaving(false)
    }
  }

  const handleRemovePicture = async () => {
    setRemovingPicture(true)
    try {
      await removePicture(sessionId)
      toast.success("Foto removida!")
      loadProfile()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover foto")
    } finally {
      setRemovingPicture(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Perfil do WhatsApp</CardTitle>
        </div>
        <CardDescription>
          Gerencie seu nome, status e foto de perfil do WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.pictureUrl} alt={profile?.pushName} />
              <AvatarFallback className="text-2xl">
                {profile?.pushName?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {profile?.jid?.split("@")[0] || ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Alterar Foto
                  </>
                )}
              </Button>
              {profile?.pictureUrl && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={removingPicture}
                    >
                      {removingPicture ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover foto?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sua foto de perfil será removida do WhatsApp.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRemovePicture}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Name Section */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome de Exibição</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              placeholder="Seu nome no WhatsApp"
              value={name}
              onChange={(e) => setNameValue(e.target.value)}
            />
            <Button onClick={handleSaveName} disabled={saving || !name.trim()} size="icon-sm">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Este nome será exibido para seus contatos
          </p>
        </div>

        {/* Status Section */}
        <div className="space-y-2">
          <Label htmlFor="status">Recado (Status)</Label>
          <div className="flex gap-2">
            <Textarea
              id="status"
              placeholder="Digite seu recado..."
              value={status}
              onChange={(e) => setStatusValue(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <Button onClick={handleSaveStatus} disabled={saving} size="icon-sm" className="self-end">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Seu recado atual no WhatsApp
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
