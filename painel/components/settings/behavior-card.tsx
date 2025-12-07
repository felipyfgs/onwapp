"use client"

import { Cog, Wifi, PhoneOff, History, Timer } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SessionSettings, UpdateSettingsRequest } from "@/lib/api/sessions"

interface BehaviorCardProps {
  settings: SessionSettings | null
  onChange: (updates: UpdateSettingsRequest) => void
  disabled?: boolean
}

interface BehaviorItemProps {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}

function BehaviorItem({ icon: Icon, label, children }: BehaviorItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-muted flex items-center justify-center">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <span className="text-sm">{label}</span>
      </div>
      {children}
    </div>
  )
}

export function BehaviorCard({ settings, onChange, disabled }: BehaviorCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cog className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Comportamento</span>
      </div>
      <div className="divide-y">
        <BehaviorItem icon={Wifi} label="Sempre online">
          <Switch
            checked={settings?.alwaysOnline || false}
            onCheckedChange={(checked) => onChange({ alwaysOnline: checked })}
            disabled={disabled}
          />
        </BehaviorItem>
        <BehaviorItem icon={PhoneOff} label="Rejeitar chamadas">
          <Switch
            checked={settings?.autoRejectCalls || false}
            onCheckedChange={(checked) => onChange({ autoRejectCalls: checked })}
            disabled={disabled}
          />
        </BehaviorItem>
        <BehaviorItem icon={History} label="Sincronizar historico">
          <Switch
            checked={settings?.syncHistory || false}
            onCheckedChange={(checked) => onChange({ syncHistory: checked })}
            disabled={disabled}
          />
        </BehaviorItem>
        <BehaviorItem icon={Timer} label="Msgs temporarias">
          <Select
            value={settings?.defaultDisappearingTimer || "off"}
            onValueChange={(v) => onChange({ defaultDisappearingTimer: v })}
            disabled={disabled}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs border-0 bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off" className="text-xs">Desativado</SelectItem>
              <SelectItem value="24h" className="text-xs">24 horas</SelectItem>
              <SelectItem value="7d" className="text-xs">7 dias</SelectItem>
              <SelectItem value="90d" className="text-xs">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </BehaviorItem>
      </div>
    </Card>
  )
}
