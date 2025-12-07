"use client"

import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface OptionsCardProps {
  signAgent: boolean
  autoReopen: boolean
  startPending: boolean
  syncContacts: boolean
  syncMessages: boolean
  onSignAgentChange: (value: boolean) => void
  onAutoReopenChange: (value: boolean) => void
  onStartPendingChange: (value: boolean) => void
  onSyncContactsChange: (value: boolean) => void
  onSyncMessagesChange: (value: boolean) => void
}

export function OptionsCard({
  signAgent,
  autoReopen,
  startPending,
  syncContacts,
  syncMessages,
  onSignAgentChange,
  onAutoReopenChange,
  onStartPendingChange,
  onSyncContactsChange,
  onSyncMessagesChange,
}: OptionsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Comportamento</CardTitle>
        <CardDescription>Opcoes da integracao</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm">Assinar com nome do agente</label>
          <Switch checked={signAgent} onCheckedChange={onSignAgentChange} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Reabrir conversa automaticamente</label>
          <Switch checked={autoReopen} onCheckedChange={onAutoReopenChange} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Iniciar como pendente</label>
          <Switch checked={startPending} onCheckedChange={onStartPendingChange} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Sincronizar contatos</label>
          <Switch checked={syncContacts} onCheckedChange={onSyncContactsChange} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Sincronizar mensagens</label>
          <Switch checked={syncMessages} onCheckedChange={onSyncMessagesChange} />
        </div>
      </CardContent>
    </Card>
  )
}
