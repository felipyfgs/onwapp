"use client"

import { Globe, Key } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

interface WebhookConfigCardProps {
  url: string
  secret: string
  enabled: boolean
  onUrlChange: (url: string) => void
  onSecretChange: (secret: string) => void
  onEnabledChange: (enabled: boolean) => void
  onUrlBlur: () => void
  onSecretBlur: () => void
}

export function WebhookConfigCard({
  url,
  secret,
  enabled,
  onUrlChange,
  onSecretChange,
  onEnabledChange,
  onUrlBlur,
  onSecretBlur,
}: WebhookConfigCardProps) {
  return (
    <Card>
      <CardContent className="p-0 divide-y">
        <div className="flex items-center gap-3 p-3">
          <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Globe className="size-4" />
          </div>
          <Input
            placeholder="https://seu-servidor.com/webhook"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onBlur={onUrlBlur}
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 p-3">
          <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Key className="size-4" />
          </div>
          <Input
            type="password"
            placeholder="Secret (opcional)"
            value={secret}
            onChange={(e) => onSecretChange(e.target.value)}
            onBlur={onSecretBlur}
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
          />
        </div>

        <div className="flex items-center justify-between p-3">
          <span className="text-sm">Ativo</span>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardContent>
    </Card>
  )
}
