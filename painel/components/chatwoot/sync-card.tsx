"use client"

import { Loader2, RefreshCw, Users, MessageSquare, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SyncStatus as SyncStatusType, SyncOverview } from "@/lib/api/chatwoot"

interface SyncCardProps {
  syncStatus: SyncStatusType | null
  overview: SyncOverview | null
  enabled: boolean
  hasDbConfig: boolean
  syncing: boolean
  syncDays: number
  onSyncDaysChange: (value: number) => void
  onSyncAll: () => void
  onSyncContacts: () => void
  onSyncMessages: () => void
  onResolveAll: () => void
}

export function SyncCard({
  syncStatus,
  overview,
  enabled,
  hasDbConfig,
  syncing,
  syncDays,
  onSyncDaysChange,
  onSyncAll,
  onSyncContacts,
  onSyncMessages,
  onResolveAll,
}: SyncCardProps) {
  const isRunning = syncStatus?.status === 'running'
  const progress = syncStatus?.total ? Math.round((syncStatus.progress || 0) / syncStatus.total * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sincronizacao</CardTitle>
        <CardDescription>
          {isRunning 
            ? `Sincronizando ${syncStatus.type}... ${progress}%`
            : 'Sincronizar dados com Chatwoot'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-muted-foreground">WhatsApp</span>
              <span className="font-medium">{overview.whatsapp.contacts} contatos</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-muted-foreground">Chatwoot</span>
              <span className="font-medium">{overview.chatwoot.contacts} contatos</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-muted-foreground">Conversas</span>
              <span className="font-medium">{overview.chatwoot.conversations}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-muted-foreground">Abertas</span>
              <span className="font-medium">{overview.chatwoot.openConversations}</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{syncStatus.progress || 0} / {syncStatus.total || 0}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Sync Buttons */}
        {!isRunning && (
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSyncAll}
              disabled={syncing || !enabled || !hasDbConfig}
            >
              <RefreshCw className="size-4 mr-1.5" />
              Sync Completo
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSyncContacts}
              disabled={syncing || !enabled || !hasDbConfig}
            >
              <Users className="size-4 mr-1.5" />
              Contatos
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSyncMessages}
              disabled={syncing || !enabled || !hasDbConfig}
            >
              <MessageSquare className="size-4 mr-1.5" />
              Mensagens
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onResolveAll}
              disabled={syncing || !enabled}
            >
              <CheckCircle className="size-4 mr-1.5" />
              Resolver Todas
            </Button>
          </div>
        )}

        {/* Sync Days */}
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="text-sm">Dias para sincronizar</label>
          <Input
            type="number"
            placeholder="7"
            value={syncDays || ""}
            onChange={(e) => onSyncDaysChange(parseInt(e.target.value) || 7)}
            className="w-20 h-8 text-sm"
          />
        </div>

        {!hasDbConfig && (
          <p className="text-xs text-muted-foreground">
            Configure o banco de dados para habilitar sincronizacao
          </p>
        )}
      </CardContent>
    </Card>
  )
}
