"use client"

import { useState, useEffect } from "react"
import { User, Building2, Phone, Copy, Ban, Check, Loader2, Globe, Mail, Clock, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  getContactAvatar, 
  getBusinessProfile, 
  updateBlocklist,
  type Contact,
  type BusinessProfile,
} from "@/lib/api/contacts"

interface ContactDetailsDialogProps {
  sessionId: string
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  blockedJids: string[]
  onBlocklistChange: () => void
}

export function ContactDetailsDialog({
  sessionId,
  contact,
  open,
  onOpenChange,
  blockedJids,
  onBlocklistChange,
}: ContactDetailsDialogProps) {
  const [avatar, setAvatar] = useState<string | null>(null)
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [blocking, setBlocking] = useState(false)

  const phone = contact?.phone || contact?.jid.split('@')[0] || ''
  const isBlocked = contact ? blockedJids.includes(contact.jid) : false
  const isBusiness = !!contact?.businessName

  useEffect(() => {
    if (!open || !contact) {
      setAvatar(null)
      setBusiness(null)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const [avatarData, businessData] = await Promise.all([
          getContactAvatar(sessionId, phone).catch(() => null),
          isBusiness ? getBusinessProfile(sessionId, phone).catch(() => null) : null,
        ])
        
        if (avatarData?.url) setAvatar(avatarData.url)
        if (businessData?.profile) setBusiness(businessData.profile)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, contact, sessionId, phone, isBusiness])

  const handleCopyPhone = async () => {
    setCopying(true)
    await navigator.clipboard.writeText(phone)
    setTimeout(() => setCopying(false), 1500)
  }

  const handleToggleBlock = async () => {
    if (!contact) return
    setBlocking(true)
    try {
      await updateBlocklist(sessionId, phone, isBlocked ? 'unblock' : 'block')
      onBlocklistChange()
    } finally {
      setBlocking(false)
    }
  }

  const displayName = contact?.fullName || contact?.pushName || contact?.businessName || phone

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Contato</DialogTitle>
        </DialogHeader>

        {contact && (
          <div className="space-y-4">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border-2">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback>
                  {isBusiness ? (
                    <Building2 className="size-6 text-muted-foreground" />
                  ) : (
                    <User className="size-6 text-muted-foreground" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{displayName}</h3>
                  {isBusiness && (
                    <Badge variant="secondary" className="shrink-0">Business</Badge>
                  )}
                  {isBlocked && (
                    <Badge variant="destructive" className="shrink-0">Bloqueado</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">+{phone}</p>
              </div>
            </div>

            {/* Phone Action */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <span className="text-sm">+{phone}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={handleCopyPhone}>
                {copying ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>

            {/* Business Info */}
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {business && !loading && (
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-sm font-medium">Informacoes Comerciais</h4>
                
                {business.description && (
                  <p className="text-sm text-muted-foreground">{business.description}</p>
                )}

                {business.category && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span>{business.category}</span>
                  </div>
                )}

                {business.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{business.address}</span>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>{business.email}</span>
                  </div>
                )}

                {business.website && business.website.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="size-4 text-muted-foreground" />
                    <a 
                      href={business.website[0]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {business.website[0]}
                    </a>
                  </div>
                )}

                {business.businessHours?.config && business.businessHours.config.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="size-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-0.5">
                      {business.businessHours.config.slice(0, 3).map((h, i) => (
                        <div key={i} className="text-muted-foreground">
                          {h.dayOfWeek}: {h.mode === 'open_24h' ? '24h' : `${h.openTime} - ${h.closeTime}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant={isBlocked ? "default" : "destructive"} 
                className="flex-1"
                onClick={handleToggleBlock}
                disabled={blocking}
              >
                {blocking ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Ban className="size-4 mr-2" />
                )}
                {isBlocked ? 'Desbloquear' : 'Bloquear'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
