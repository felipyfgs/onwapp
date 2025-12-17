"use client"

import { useState, ReactNode } from "react"
import { useRouter } from "next/navigation"

import { createSession } from "@/lib/api/sessions"
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

interface CreateSessionDialogProps {
  onSuccess?: () => void
  children?: ReactNode
}

export function CreateSessionDialog({ onSuccess, children }: CreateSessionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sessionName.trim()) return

    setLoading(true)
    setError(null)

    const response = await createSession({ session: sessionName.trim() })

    if (response.success) {
      setOpen(false)
      setSessionName("")
      onSuccess?.()
      router.refresh()
    } else {
      setError(response.error || "Failed to create session")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            New Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Create a new WhatsApp session. You can connect it after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                placeholder="my-session"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !sessionName.trim()}>
              {loading ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
