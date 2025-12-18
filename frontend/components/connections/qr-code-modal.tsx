'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function QRCodeModal({ 
  isOpen, 
  onClose, 
  session 
}: { 
  isOpen: boolean 
  onClose: () => void 
  session: any | null 
}) {
  const [qrCode, setQRCode] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Simulate QR code generation and connection process
    const simulateConnection = async () => {
      try {
        // Loading state
        setStatus('loading')
        setError(null)

        // Generate QR code (simulated)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setQRCode('data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="80" height="80" fill="black"/><rect x="20" y="20" width="60" height="60" fill="white"/><rect x="30" y="30" width="40" height="40" fill="black"/><rect x="40" y="40" width="20" height="20" fill="white"/></svg>'))
        setStatus('ready')

        // Simulate connection after 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000))
        setStatus('connected')

        // Close modal after connection
        setTimeout(() => onClose(), 1000)

      } catch (err) {
        setStatus('error')
        setError('Failed to generate QR code')
      }
    }

    simulateConnection()

    return () => {
      // Cleanup
    }
  }, [isOpen, onClose])

  const getContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating QR code...</p>
          </div>
        )

      case 'ready':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              {qrCode && (
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64 object-contain" 
                />
              )}
            </div>
            <p className="text-muted-foreground text-center">
              Scan this QR code with your {session?.platform || 'messaging app'} to connect
            </p>
          </div>
        )

      case 'connected':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-xl font-semibold">Connected Successfully!</h3>
            <p className="text-muted-foreground text-center">
              Your messaging channel is now connected and ready to receive messages.
            </p>
          </div>
        )

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <XCircle className="h-12 w-12 text-red-500" />
            <h3 className="text-xl font-semibold">Connection Failed</h3>
            <p className="text-muted-foreground text-center">
              {error || 'An error occurred while trying to connect'}
            </p>
            <Button onClick={() => setStatus('loading')}>Try Again</Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {session ? `Connect ${session.name}` : 'Add New Connection'}
          </SheetTitle>
          <SheetDescription>
            {session 
              ? `Connect your ${session.platform} channel to start receiving messages`
              : 'Set up a new messaging channel connection'}
          </SheetDescription>
        </SheetHeader>

        {getContent()}

        {status !== 'connected' && status !== 'loading' && (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
