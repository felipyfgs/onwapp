"use client"

import { useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { syncAll } from "@/lib/api/chatwoot"

interface SyncSettingsProps {
  sessionId: string
  syncContacts?: boolean
  syncMessages?: boolean
  syncDays?: number
  onSyncContactsChange?: (value: boolean) => void
  onSyncMessagesChange?: (value: boolean) => void
  onSyncDaysChange?: (value: number) => void
}

export function SyncSettings({
  sessionId,
  syncContacts = true,
  syncMessages = true,
  syncDays = 7,
  onSyncContactsChange,
  onSyncMessagesChange,
  onSyncDaysChange,
}: SyncSettingsProps) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const handleSync = async () => {
    try {
      setSyncing(true)
      await syncAll(sessionId)
      setLastSync(new Date())
    } catch (err) {
      console.error("Sync failed:", err)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Settings</CardTitle>
        <CardDescription>Configure data synchronization with Chatwoot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="syncContacts">Sync Contacts</Label>
            <p className="text-sm text-muted-foreground">
              Automatically sync WhatsApp contacts to Chatwoot
            </p>
          </div>
          <Switch
            id="syncContacts"
            checked={syncContacts}
            onCheckedChange={onSyncContactsChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="syncMessages">Sync Messages</Label>
            <p className="text-sm text-muted-foreground">
              Sync message history with Chatwoot conversations
            </p>
          </div>
          <Switch
            id="syncMessages"
            checked={syncMessages}
            onCheckedChange={onSyncMessagesChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="syncDays">History Days</Label>
          <div className="flex items-center gap-2">
            <Input
              id="syncDays"
              type="number"
              value={syncDays}
              onChange={(e) => onSyncDaysChange?.(parseInt(e.target.value) || 7)}
              className="w-24"
              min={1}
              max={30}
            />
            <span className="text-sm text-muted-foreground">days of message history</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Manual Sync</p>
              <p className="text-sm text-muted-foreground">
                {lastSync
                  ? `Last sync: ${lastSync.toLocaleString()}`
                  : "Trigger a full sync with Chatwoot"}
              </p>
            </div>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
