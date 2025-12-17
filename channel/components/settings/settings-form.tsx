"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getSettings,
  updateSettings,
  SessionSettings,
  UpdateSettingsRequest,
  PRIVACY_OPTIONS,
  ONLINE_OPTIONS,
  READ_RECEIPTS_OPTIONS,
  GROUP_ADD_OPTIONS,
  CALL_ADD_OPTIONS,
  DISAPPEARING_OPTIONS,
} from "@/lib/api/settings"

interface SettingsFormProps {
  onUpdate?: () => void
}

export function SettingsForm({ onUpdate }: SettingsFormProps) {
  const sessionId = ""
  const [settings, setSettings] = useState<SessionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changes, setChanges] = useState<UpdateSettingsRequest>({})

  useEffect(() => {
    fetchSettings()
  }, [sessionId])

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    const res = await getSettings(sessionId)
    if (res.success && res.data) {
      setSettings(res.data)
      setChanges({})
    } else {
      setError(res.error || "Failed to load settings")
    }
    setLoading(false)
  }

  const handleChange = <K extends keyof UpdateSettingsRequest>(
    key: K,
    value: UpdateSettingsRequest[K]
  ) => {
    setChanges((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) return
    setSaving(true)
    const res = await updateSettings(sessionId, changes)
    if (res.success && res.data) {
      setSettings(res.data)
      setChanges({})
      onUpdate?.()
    } else {
      setError(res.error || "Failed to save settings")
    }
    setSaving(false)
  }

  const hasChanges = Object.keys(changes).length > 0

  const getValue = <K extends keyof SessionSettings>(key: K): SessionSettings[K] | undefined => {
    if (!settings) return undefined
    return (changes[key as keyof UpdateSettingsRequest] as SessionSettings[K]) ?? settings[key]
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error || !settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{error || "Failed to load settings"}</p>
          <Button onClick={fetchSettings} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Local Settings</CardTitle>
          <CardDescription>OnWapp-specific behavior settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="alwaysOnline">Always Online</Label>
              <p className="text-sm text-muted-foreground">
                Keep session always marked as online
              </p>
            </div>
            <Switch
              id="alwaysOnline"
              checked={getValue("alwaysOnline") ?? false}
              onCheckedChange={(v) => handleChange("alwaysOnline", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoRejectCalls">Auto-Reject Calls</Label>
              <p className="text-sm text-muted-foreground">
                Automatically reject incoming calls
              </p>
            </div>
            <Switch
              id="autoRejectCalls"
              checked={getValue("autoRejectCalls") ?? false}
              onCheckedChange={(v) => handleChange("autoRejectCalls", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="syncHistory">Sync History</Label>
              <p className="text-sm text-muted-foreground">
                Sync message history on connect
              </p>
            </div>
            <Switch
              id="syncHistory"
              checked={getValue("syncHistory") ?? false}
              onCheckedChange={(v) => handleChange("syncHistory", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Control who can see your information (synced with WhatsApp)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastSeen">Last Seen</Label>
              <Select
                value={getValue("lastSeen") || ""}
                onValueChange={(v) => handleChange("lastSeen", v as typeof settings.lastSeen)}
              >
                <SelectTrigger id="lastSeen">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="online">Online Status</Label>
              <Select
                value={getValue("online") || ""}
                onValueChange={(v) => handleChange("online", v as typeof settings.online)}
              >
                <SelectTrigger id="online">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {ONLINE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePhoto">Profile Photo</Label>
              <Select
                value={getValue("profilePhoto") || ""}
                onValueChange={(v) => handleChange("profilePhoto", v as typeof settings.profilePhoto)}
              >
                <SelectTrigger id="profilePhoto">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">About/Status</Label>
              <Select
                value={getValue("status") || ""}
                onValueChange={(v) => handleChange("status", v as typeof settings.status)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="readReceipts">Read Receipts</Label>
              <Select
                value={getValue("readReceipts") || ""}
                onValueChange={(v) => handleChange("readReceipts", v as typeof settings.readReceipts)}
              >
                <SelectTrigger id="readReceipts">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {READ_RECEIPTS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupAdd">Group Add</Label>
              <Select
                value={getValue("groupAdd") || ""}
                onValueChange={(v) => handleChange("groupAdd", v as typeof settings.groupAdd)}
              >
                <SelectTrigger id="groupAdd">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_ADD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="callAdd">Calls</Label>
              <Select
                value={getValue("callAdd") || ""}
                onValueChange={(v) => handleChange("callAdd", v as typeof settings.callAdd)}
              >
                <SelectTrigger id="callAdd">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {CALL_ADD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disappearing">Default Disappearing Messages</Label>
              <Select
                value={getValue("defaultDisappearingTimer") || ""}
                onValueChange={(v) =>
                  handleChange("defaultDisappearingTimer", v as typeof settings.defaultDisappearingTimer)
                }
              >
                <SelectTrigger id="disappearing">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {DISAPPEARING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {settings.privacySyncedAt && (
            <p className="text-xs text-muted-foreground">
              Last synced with WhatsApp:{" "}
              {new Date(settings.privacySyncedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
