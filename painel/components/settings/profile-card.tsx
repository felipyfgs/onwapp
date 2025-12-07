"use client"

import { useState, useRef } from "react"
import { User, Camera, Loader2, Pencil, Phone, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  updatePushName,
  updateStatus,
  updateProfilePicture,
} from "@/lib/api/sessions"

interface ProfileCardProps {
  sessionId: string
  phone?: string
  pushName?: string
  status?: string
  pictureUrl?: string
  onUpdate?: () => void
}

export function ProfileCard({
  sessionId,
  phone,
  pushName: initialPushName,
  status: initialStatus,
  pictureUrl: initialPictureUrl,
  onUpdate,
}: ProfileCardProps) {
  const [pushName, setPushName] = useState(initialPushName || "")
  const [status, setStatus] = useState(initialStatus || "")
  const [pictureUrl, setPictureUrl] = useState(initialPictureUrl)
  const [editingName, setEditingName] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSaveName = async () => {
    if (!pushName.trim()) return
    setSaving("name")
    try {
      await updatePushName(sessionId, pushName)
      setEditingName(false)
      onUpdate?.()
    } catch {} finally {
      setSaving(null)
    }
  }

  const handleSaveStatus = async () => {
    setSaving("status")
    try {
      await updateStatus(sessionId, status)
      setEditingStatus(false)
      onUpdate?.()
    } catch {} finally {
      setSaving(null)
    }
  }

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving("picture")
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await updateProfilePicture(sessionId, reader.result as string)
        setPictureUrl(reader.result as string)
        onUpdate?.()
      } catch {} finally {
        setSaving(null)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <User className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Perfil</span>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 pb-3 mb-3 border-b">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Avatar className="size-16 border-2">
            <AvatarImage src={pictureUrl} />
            <AvatarFallback className="text-lg">{pushName?.[0]?.toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {saving === "picture" ? <Loader2 className="size-5 text-white animate-spin" /> : <Camera className="size-5 text-white" />}
          </div>
        </div>
        <div>
          <p className="font-medium">{pushName || "-"}</p>
          <p className="text-xs text-muted-foreground">{phone ? `+${phone}` : "Sem telefone"}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-0 divide-y">
        {/* Phone */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <Phone className="size-4 text-muted-foreground" />
            </div>
            <span className="text-sm">Telefone</span>
          </div>
          <span className="text-sm text-muted-foreground">{phone ? `+${phone}` : "-"}</span>
        </div>

        {/* Name */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <User className="size-4 text-muted-foreground" />
            </div>
            <span className="text-sm">Nome<span className="text-destructive ml-0.5">*</span></span>
          </div>
          {editingName ? (
            <div className="flex gap-1.5">
              <Input value={pushName} onChange={(e) => setPushName(e.target.value)} className="h-8 w-28 text-xs" />
              <Button size="sm" className="h-8 px-2" onClick={handleSaveName} disabled={saving === "name"}>
                {saving === "name" ? <Loader2 className="size-3 animate-spin" /> : "OK"}
              </Button>
            </div>
          ) : (
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" onClick={() => setEditingName(true)}>
              {pushName || "-"} <Pencil className="size-3" />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="size-4 text-muted-foreground" />
            </div>
            <span className="text-sm">Recado</span>
          </div>
          {editingStatus ? (
            <div className="flex gap-1.5">
              <Input value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 w-28 text-xs" />
              <Button size="sm" className="h-8 px-2" onClick={handleSaveStatus} disabled={saving === "status"}>
                {saving === "status" ? <Loader2 className="size-3 animate-spin" /> : "OK"}
              </Button>
            </div>
          ) : (
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground truncate max-w-[150px]" onClick={() => setEditingStatus(true)}>
              <span className="truncate">{status || "-"}</span> <Pencil className="size-3 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
