"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { disconnectSession, deleteSession } from "@/lib/api/sessions"

interface DangerZoneProps {
  sessionId: string
  sessionName: string
  isConnected: boolean
}

export function DangerZone({ sessionId, sessionName, isConnected }: DangerZoneProps) {
  const router = useRouter()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      await disconnectSession(sessionId)
      setLogoutDialogOpen(false)
      router.refresh()
    } catch (err) {
      console.error("Failed to logout:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteSession(sessionId)
      setDeleteDialogOpen(false)
      router.push("/sessions")
    } catch (err) {
      console.error("Failed to delete session:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border">
            <div>
              <p className="font-medium">Logout from WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Disconnect this session from WhatsApp. You will need to scan QR code again.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(true)}
              disabled={!isConnected}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border border-destructive/50">
            <div>
              <p className="font-medium">Delete Session</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this session and all associated data.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Logout from WhatsApp"
        description={`Are you sure you want to logout session "${sessionName}"? You will need to scan QR code again to reconnect.`}
        confirmLabel="Logout"
        onConfirm={handleLogout}
        loading={loading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Session"
        description={`Are you sure you want to delete session "${sessionName}"? This action cannot be undone and all data will be permanently lost.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  )
}
