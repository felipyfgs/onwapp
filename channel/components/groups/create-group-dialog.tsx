"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"

import { createGroup, Group } from "@/lib/api/groups"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CreateGroupDialogProps {
  sessionId: string
  onSuccess?: (group: Group) => void
}

export function CreateGroupDialog({ sessionId, onSuccess }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [participants, setParticipants] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setOpen(false)
    setName("")
    setParticipants("")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const participantList = participants
      .split(/[\n,]/)
      .map((p) => p.trim().replace(/\D/g, ""))
      .filter((p) => p.length > 0)
      .map((p) => `${p}@s.whatsapp.net`)

    const response = await createGroup(sessionId, {
      name: name.trim(),
      participants: participantList,
    })

    if (response.success && response.data) {
      onSuccess?.(response.data)
      handleClose()
    } else {
      setError(response.error || "Failed to create group")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Create a new WhatsApp group with participants</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="My Group"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants">Participants (optional)</Label>
              <Textarea
                id="participants"
                placeholder="Enter phone numbers, one per line or comma-separated&#10;+55 11 99999-9999&#10;+55 21 88888-8888"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                disabled={loading}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Phone numbers with country code, separated by commas or new lines
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
