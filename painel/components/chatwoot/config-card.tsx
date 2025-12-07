"use client"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ConfigCardProps {
  enabled: boolean
  url: string
  token: string
  account: number
  inboxId: number
  onEnabledChange: (enabled: boolean) => void
  onUrlChange: (url: string) => void
  onTokenChange: (token: string) => void
  onAccountChange: (account: number) => void
  onInboxIdChange: (inboxId: number) => void
}

export function ConfigCard({
  enabled,
  url,
  token,
  account,
  inboxId,
  onEnabledChange,
  onUrlChange,
  onTokenChange,
  onAccountChange,
  onInboxIdChange,
}: ConfigCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Credenciais</CardTitle>
        <CardDescription>Dados de acesso ao Chatwoot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
          <label className="text-sm font-medium">Integracao ativa</label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">URL</label>
          <Input
            placeholder="https://app.chatwoot.com"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">API Token</label>
          <Input
            type="password"
            placeholder="Token de acesso"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Account ID</label>
            <Input
              type="number"
              placeholder="1"
              value={account || ""}
              onChange={(e) => onAccountChange(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Inbox ID</label>
            <Input
              type="number"
              placeholder="1"
              value={inboxId || ""}
              onChange={(e) => onInboxIdChange(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
