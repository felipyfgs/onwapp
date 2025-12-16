"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Settings {
  autoDownloadMedia: boolean
  autoReadMessages: boolean
  syncHistory: boolean
  debugMode: boolean
}

interface SettingsFormProps {
  sessionId: string
  onUpdate?: () => void
}

export function SettingsForm({ sessionId, onUpdate }: SettingsFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    autoDownloadMedia: true,
    autoReadMessages: false,
    syncHistory: true,
    debugMode: false,
  })
  const [originalSettings, setOriginalSettings] = useState<Settings | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true)
        // TODO: Replace with actual API call when available
        const mockSettings: Settings = {
          autoDownloadMedia: true,
          autoReadMessages: false,
          syncHistory: true,
          debugMode: false,
        }
        setSettings(mockSettings)
        setOriginalSettings(mockSettings)
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [sessionId])

  const hasChanges = originalSettings && JSON.stringify(settings) !== JSON.stringify(originalSettings)

  const handleToggle = (key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // TODO: Implement save API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setOriginalSettings(settings)
      onUpdate?.()
    } catch (err) {
      console.error("Failed to save settings:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Settings</CardTitle>
          <CardDescription>Configure session behavior</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const settingsItems = [
    {
      key: "autoDownloadMedia" as const,
      label: "Auto Download Media",
      description: "Automatically download received media files",
    },
    {
      key: "autoReadMessages" as const,
      label: "Auto Read Messages",
      description: "Mark messages as read when received",
    },
    {
      key: "syncHistory" as const,
      label: "Sync Message History",
      description: "Sync message history when connecting",
    },
    {
      key: "debugMode" as const,
      label: "Debug Mode",
      description: "Enable verbose logging for troubleshooting",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Settings</CardTitle>
        <CardDescription>Configure session behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settingsItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={item.key}>{item.label}</Label>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              id={item.key}
              checked={settings[item.key]}
              onCheckedChange={() => handleToggle(item.key)}
            />
          </div>
        ))}

        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
