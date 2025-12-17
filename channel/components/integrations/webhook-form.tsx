"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, TestTube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getWebhook, setWebhook } from "@/lib/api/webhook"

interface WebhookFormProps {
  sessionId: string
  onUpdate?: () => void
}

export function WebhookForm({ sessionId, onUpdate }: WebhookFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [url, setUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [events, setEvents] = useState<string[]>([])

  useEffect(() => {
    async function fetchWebhook() {
      try {
        setLoading(true)
        const webhook = await getWebhook(sessionId)
        if (webhook.success && webhook.data) {
          setUrl(webhook.data.url || "")
          setSecret(webhook.data.secret || "")
          setEnabled(webhook.data.enabled || false)
          setEvents(webhook.data.events || [])
        }
      } catch (err) {
        console.error("Failed to load webhook:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchWebhook()
  }, [sessionId])

  const handleSave = async () => {
    try {
      setSaving(true)
      await setWebhook(sessionId, { url, secret, enabled, events })
      onUpdate?.()
    } catch (err) {
      console.error("Failed to save webhook:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      // TODO: Implement webhook test endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (err) {
      console.error("Failed to test webhook:", err)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>Receive real-time event notifications</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>Receive real-time event notifications</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="enabled" className="text-sm">Enabled</Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">Webhook URL</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            type="url"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secret">Secret (optional)</Label>
          <Input
            id="secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="HMAC secret for signature validation"
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            Used to sign webhook payloads with HMAC-SHA256
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !url}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing || !url}>
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
