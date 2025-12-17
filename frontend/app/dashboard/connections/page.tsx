'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import QRCodeModal from '@/components/connections/qr-code-modal'

export default function ConnectionsPage() {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)

  // Mock data - replace with actual API calls
  const sessions = [
    {
      id: '1',
      name: 'Main Support Channel',
      channelId: '5511999999999@s.whatsapp.net',
      platform: 'whatsapp',
      status: 'connected',
      lastSeen: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Sales Channel',
      channelId: '5511888888888@s.whatsapp.net',
      platform: 'whatsapp',
      status: 'disconnected',
      lastSeen: null
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>
      case 'connecting':
        return <Badge variant="secondary">Connecting...</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleConnect = (session: any) => {
    setSelectedSession(session)
    setIsQRModalOpen(true)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messaging Connections</h1>
        <Button onClick={() => handleConnect(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{session.name}</CardTitle>
              <CardDescription>{session.channelId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Platform</span>
                <span className="capitalize">{session.platform}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(session.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Seen</span>
                <span className="text-sm">
                  {session.lastSeen ? new Date(session.lastSeen).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex space-x-2">
                {session.status === 'disconnected' && (
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => handleConnect(session)}
                  >
                    Connect
                  </Button>
                )}
                <Button variant="destructive" className="flex-1">
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        session={selectedSession}
      />
    </div>
  )
}
