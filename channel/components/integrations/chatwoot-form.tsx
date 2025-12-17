"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getChatwootConfig, setChatwootConfig, validateCredentials, type ChatwootConfig } from "@/lib/api/chatwoot"

interface ChatwootFormProps {
  sessionId: string
  onUpdate?: () => void
}

export function ChatwootForm({ sessionId, onUpdate }: ChatwootFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState<boolean | null>(null)
  
  const [enabled, setEnabled] = useState(false)
  const [url, setUrl] = useState("")
  const [token, setToken] = useState("")
  const [account, setAccount] = useState("")
  const [inboxId, setInboxId] = useState("")

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true)
        const config = await getChatwootConfig(sessionId)
        if (config.success && config.data) {
          setEnabled(config.data.enabled || false)
          setUrl(config.data.url || "")
          setToken(config.data.token || "")
          setAccount(String(config.data.account || ""))
          setInboxId(String(config.data.inboxId || ""))
        }
      } catch (err) {
        console.error("Failed to load Chatwoot config:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [sessionId])

  const handleValidate = async () => {
    try {
      setValidating(true)
      setValidated(null)
      const result = await validateCredentials({
        url,
        token,
        account: parseInt(account),
      })
      setValidated(result.data?.valid ?? false)
    } catch (err) {
      console.error("Validation failed:", err)
      setValidated(false)
    } finally {
      setValidating(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await setChatwootConfig(sessionId, {
        enabled,
        url,
        token,
        account: parseInt(account),
        inboxId: parseInt(inboxId),
      })
      onUpdate?.()
    } catch (err) {
      console.error("Failed to save config:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chatwoot Configuration</CardTitle>
          <CardDescription>Connect to your Chatwoot instance</CardDescription>
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
            <CardTitle className="flex items-center gap-2">
              Chatwoot Configuration
              {validated === true && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid
                </Badge>
              )}
              {validated === false && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Invalid
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Connect to your Chatwoot instance</CardDescription>
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
          <Label htmlFor="url">Chatwoot URL</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setValidated(null)
            }}
            placeholder="https://chatwoot.example.com"
            type="url"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">API Token</Label>
          <Input
            id="token"
            value={token}
            onChange={(e) => {
              setToken(e.target.value)
              setValidated(null)
            }}
            placeholder="Your Chatwoot API token"
            type="password"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account">Account ID</Label>
            <Input
              id="account"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value)
                setValidated(null)
              }}
              placeholder="1"
              type="number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inboxId">Inbox ID</Label>
            <Input
              id="inboxId"
              value={inboxId}
              onChange={(e) => {
                setInboxId(e.target.value)
                setValidated(null)
              }}
              placeholder="1"
              type="number"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
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
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={validating || !url || !token || !account || !inboxId}
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              "Validate Credentials"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
