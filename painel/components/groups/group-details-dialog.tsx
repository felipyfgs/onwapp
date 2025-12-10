"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Link2, Copy, LogOut, Crown, Shield, Loader2 } from "lucide-react"
import { GroupInfo } from "@/lib/api/groups"

interface GroupDetailsDialogProps {
  group: GroupInfo | null
  loading: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onGetInviteLink: () => Promise<string | null>
  onLeave: () => Promise<void>
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase() || "G"
}

function formatPhone(jid: string) {
  const phone = jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
  return `+${phone}`
}

export function GroupDetailsDialog({
  group,
  loading,
  open,
  onOpenChange,
  onGetInviteLink,
  onLeave,
}: GroupDetailsDialogProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const handleGetInviteLink = async () => {
    const link = await onGetInviteLink()
    setInviteLink(link)
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleLeave = async () => {
    setLeaving(true)
    try {
      await onLeave()
    } finally {
      setLeaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setInviteLink(null)
      setCopySuccess(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Grupo</DialogTitle>
          <DialogDescription>Informações e ações do grupo</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : group ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={group.profilePicture} alt={group.name} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                  {getInitials(group.name || "Grupo")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {group.participants?.length || 0} participantes
                </p>
              </div>
            </div>

            {group.topic && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{group.topic}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {group.isAnnounce && (
                <Badge variant="secondary">Somente admins enviam</Badge>
              )}
              {group.isLocked && <Badge variant="secondary">Edição restrita</Badge>}
            </div>

            {group.participants && group.participants.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Participantes</h4>
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {group.participants.slice(0, 20).map((participant) => (
                    <div
                      key={participant.jid}
                      className="flex items-center gap-2 p-2 text-sm"
                    >
                      <span className="flex-1 truncate">
                        {formatPhone(participant.jid)}
                      </span>
                      {participant.isSuperAdmin && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      {participant.isAdmin && !participant.isSuperAdmin && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  ))}
                  {group.participants.length > 20 && (
                    <p className="p-2 text-sm text-muted-foreground text-center">
                      +{group.participants.length - 20} participantes
                    </p>
                  )}
                </div>
              </div>
            )}

            {inviteLink && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <code className="flex-1 text-xs truncate">{inviteLink}</code>
                <Button variant="ghost" size="icon" onClick={handleCopyLink}>
                  <Copy
                    className={`h-4 w-4 ${copySuccess ? "text-green-500" : ""}`}
                  />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGetInviteLink} className="flex-1">
                <Link2 className="h-4 w-4 mr-2" />
                Link de convite
              </Button>
              <Button variant="destructive" onClick={handleLeave} disabled={leaving}>
                {leaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
