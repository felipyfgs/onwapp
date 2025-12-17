"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getProfile, setPushName, setStatus } from "@/lib/api/profile"

interface ProfileFormProps {
  sessionId: string
  onUpdate?: () => void
}

export function ProfileForm({ sessionId, onUpdate }: ProfileFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushName, setPushNameValue] = useState("")
  const [about, setAbout] = useState("")
  const [originalPushName, setOriginalPushName] = useState("")
  const [originalAbout, setOriginalAbout] = useState("")

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const profile = await getProfile(sessionId)
        if (profile.success && profile.data) {
          setPushNameValue(profile.data.pushName || "")
          setAbout(profile.data.about || "")
          setOriginalPushName(profile.data.pushName || "")
          setOriginalAbout(profile.data.about || "")
        }
      } catch (err) {
        console.error("Failed to load profile:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [sessionId])

  const hasChanges = pushName !== originalPushName || about !== originalAbout

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (pushName !== originalPushName) {
        await setPushName(sessionId, pushName)
        setOriginalPushName(pushName)
      }
      
      if (about !== originalAbout) {
        await setStatus(sessionId, about)
        setOriginalAbout(about)
      }
      
      onUpdate?.()
    } catch (err) {
      console.error("Failed to save profile:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your WhatsApp profile details</CardDescription>
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
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your WhatsApp profile details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pushName">Display Name</Label>
          <Input
            id="pushName"
            value={pushName}
            onChange={(e) => setPushNameValue(e.target.value)}
            placeholder="Your display name"
            maxLength={25}
          />
          <p className="text-xs text-muted-foreground">
            This name will be visible to your contacts
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="about">About</Label>
          <Textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Hey there! I am using WhatsApp."
            maxLength={139}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {about.length}/139 characters
          </p>
        </div>

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
