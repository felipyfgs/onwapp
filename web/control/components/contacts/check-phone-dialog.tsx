"use client"

import { useState } from "react"
import { Phone, CheckCircle, XCircle, Loader2 } from "lucide-react"

import { checkPhone, CheckPhoneResult } from "@/lib/api/contacts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CheckPhoneDialogProps {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckPhoneDialog({ sessionId, open, onOpenChange }: CheckPhoneDialogProps) {
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckPhoneResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheck() {
    if (!phone.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    const cleanPhone = phone.replace(/\D/g, "")
    const response = await checkPhone(sessionId, [cleanPhone])

    if (response.success && response.data && response.data.length > 0) {
      setResult(response.data[0])
    } else {
      setError(response.error || "Failed to check phone number")
    }

    setLoading(false)
  }

  function handleClose() {
    setPhone("")
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check Phone Number</DialogTitle>
          <DialogDescription>Verify if a phone number is registered on WhatsApp</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                placeholder="+55 11 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
              <Button onClick={handleCheck} disabled={loading || !phone.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Enter the phone number with country code</p>
          </div>

          {result && (
            <div className={`flex items-center gap-3 rounded-lg border p-4 ${result.exists ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
              {result.exists ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <p className="font-medium">{result.exists ? "Registered on WhatsApp" : "Not on WhatsApp"}</p>
                <p className="text-sm text-muted-foreground">{result.phone}</p>
                {result.exists && result.jid && (
                  <p className="text-xs text-muted-foreground mt-1">JID: {result.jid}</p>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
