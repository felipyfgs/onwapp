"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Link2, LogOut, MessageSquare, QrCode, RefreshCw, Users, PowerOff, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { connectSession, disconnectSession, logoutSession, restartSession } from "@/lib/api/sessions"

interface QuickActionsProps {
  sessionId: string
  sessionName: string
  status: "connected" | "connecting" | "disconnected"
  onStatusChange?: () => void
}

export function QuickActions({ sessionId, sessionName, status, onStatusChange }: QuickActionsProps) {
  const router = useRouter()
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [restartDialogOpen, setRestartDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isConnected = status === "connected"
  const isConnecting = status === "connecting"

  const handleConnect = async () => {
    try {
      setLoading(true)
      await connectSession(sessionId)
      setQrDialogOpen(true)
    } catch (err) {
      console.error("Failed to connect:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setLoading(true)
      await disconnectSession(sessionId)
      setDisconnectDialogOpen(false)
      onStatusChange?.()
    } catch (err) {
      console.error("Failed to disconnect:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      await logoutSession(sessionId)
      setLogoutDialogOpen(false)
      onStatusChange?.()
    } catch (err) {
      console.error("Failed to logout:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async () => {
    try {
      setLoading(true)
      await restartSession(sessionId)
      setRestartDialogOpen(false)
      onStatusChange?.()
    } catch (err) {
      console.error("Failed to restart:", err)
    } finally {
      setLoading(false)
    }
  }

  const quickLinks = [
    { label: "Chats", href: `/sessions/${sessionId}/chats`, icon: MessageSquare },
    { label: "Contacts", href: `/sessions/${sessionId}/contacts`, icon: Users },
    { label: "Integrations", href: `/sessions/${sessionId}/integrations`, icon: Link2 },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common operations for this session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {isConnected ? (
              <Button
                variant="destructive"
                onClick={() => setDisconnectDialogOpen(true)}
                disabled={loading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={loading || isConnecting}>
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            )}

            {isConnected && (
              <Button variant="outline" onClick={() => setQrDialogOpen(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                Show QR Code
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setRestartDialogOpen(true)}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>

            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(true)}
              disabled={loading}
            >
              <PowerOff className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(link.href)}
                >
                  <link.icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        sessionId={sessionId}
        onConnected={() => {
          setQrDialogOpen(false)
          onStatusChange?.()
        }}
      />

      <ConfirmDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        title="Disconnect Session"
        description={`Are you sure you want to disconnect "${sessionName}"? You will need to scan the QR code again to reconnect.`}
        confirmText="Disconnect"
        variant="destructive"
        onConfirm={handleDisconnect}
        loading={loading}
      />

      <ConfirmDialog
        open={restartDialogOpen}
        onOpenChange={setRestartDialogOpen}
        title="Restart Session"
        description={`Are you sure you want to restart "${sessionName}"? This will temporarily disconnect and reconnect the session.`}
        confirmText="Restart"
        variant="default"
        onConfirm={handleRestart}
        loading={loading}
      />

      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Logout Session"
        description={`Are you sure you want to logout "${sessionName}"? You will need to scan the QR code again to reconnect.`}
        confirmText="Logout"
        variant="destructive"
        onConfirm={handleLogout}
        loading={loading}
      />
    </>
  )
}
