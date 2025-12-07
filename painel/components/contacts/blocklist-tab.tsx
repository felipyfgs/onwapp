"use client"

import { useState } from "react"
import { Ban, Loader2, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateBlocklist } from "@/lib/api/contacts"

interface BlocklistTabProps {
  sessionId: string
  blockedJids: string[]
  onUnblock: () => void
}

export function BlocklistTab({
  sessionId,
  blockedJids,
  onUnblock,
}: BlocklistTabProps) {
  const [unblocking, setUnblocking] = useState<string | null>(null)

  const handleUnblock = async (jid: string) => {
    const phone = jid.split('@')[0]
    setUnblocking(jid)
    try {
      await updateBlocklist(sessionId, phone, 'unblock')
      onUnblock()
    } finally {
      setUnblocking(null)
    }
  }

  if (blockedJids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Ban className="size-12 mb-4" />
        <p>Nenhum contato bloqueado</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border divide-y">
      {blockedJids.map((jid) => {
        const phone = jid.split('@')[0]
        return (
          <div
            key={jid}
            className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <UserX className="size-5 text-destructive" />
              </div>
              <div>
                <span className="font-medium">+{phone}</span>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{jid}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUnblock(jid)}
              disabled={unblocking === jid}
            >
              {unblocking === jid ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Desbloquear'
              )}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
