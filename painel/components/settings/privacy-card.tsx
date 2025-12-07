"use client"

import { Shield, Eye, Clock, Image, MessageSquare, CheckCheck, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SessionSettings, UpdateSettingsRequest } from "@/lib/api/sessions"

const PRIVACY_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "contacts", label: "Contatos" },
  { value: "none", label: "Ninguem" },
]

interface PrivacyCardProps {
  settings: SessionSettings | null
  onChange: (updates: UpdateSettingsRequest) => void
  disabled?: boolean
}

interface PrivacyItemProps {
  icon: React.ElementType
  label: string
  value: string
  onChange: (value: string) => void
  options?: { value: string; label: string }[]
  disabled?: boolean
}

function PrivacyItem({ icon: Icon, label, value, onChange, options = PRIVACY_OPTIONS, disabled }: PrivacyItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-muted flex items-center justify-center">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-[100px] h-8 text-xs border-0 bg-muted/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function PrivacyCard({ settings, onChange, disabled }: PrivacyCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Privacidade</span>
      </div>
      <div className="divide-y">
        <PrivacyItem
          icon={Clock}
          label="Visto por ultimo"
          value={settings?.lastSeen || "all"}
          onChange={(v) => onChange({ lastSeen: v })}
          disabled={disabled}
        />
        <PrivacyItem
          icon={Eye}
          label="Online"
          value={settings?.online || "all"}
          onChange={(v) => onChange({ online: v })}
          disabled={disabled}
        />
        <PrivacyItem
          icon={Image}
          label="Foto de perfil"
          value={settings?.profilePhoto || "all"}
          onChange={(v) => onChange({ profilePhoto: v })}
          disabled={disabled}
        />
        <PrivacyItem
          icon={MessageSquare}
          label="Recado"
          value={settings?.status || "all"}
          onChange={(v) => onChange({ status: v })}
          disabled={disabled}
        />
        <PrivacyItem
          icon={CheckCheck}
          label="Confirmacao de leitura"
          value={settings?.readReceipts || "all"}
          onChange={(v) => onChange({ readReceipts: v })}
          options={[{ value: "all", label: "Ativado" }, { value: "none", label: "Desativado" }]}
          disabled={disabled}
        />
        <PrivacyItem
          icon={Users}
          label="Adicionar em grupos"
          value={settings?.groupAdd || "all"}
          onChange={(v) => onChange({ groupAdd: v })}
          disabled={disabled}
        />
      </div>
    </Card>
  )
}
