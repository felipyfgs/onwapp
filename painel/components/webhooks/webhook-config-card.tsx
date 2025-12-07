"use client"

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
}

export function WebhookConfigCard({
  url,
  secret,
  enabled,
  onUrlChange,
  onSecretChange,
  onEnabledChange,
}: WebhookConfigCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Switch id="webhook-enabled" checked={enabled} onCheckedChange={onEnabledChange} />
          <label htmlFor="webhook-enabled" className="text-sm font-medium">
            Webhook ativo
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">URL do Webhook</label>
          <Input
            placeholder="https://seu-servidor.com/webhook"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Secret (opcional)</label>
          <Input
            type="password"
            placeholder="Para validar requests"
            value={secret}
            onChange={(e) => onSecretChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
