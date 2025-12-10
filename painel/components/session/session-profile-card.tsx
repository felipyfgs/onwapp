"use client"

import { ApiSession } from "@/lib/api/sessions"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Phone, Building2, Clock, Copy, Check } from "lucide-react"
import { useState } from "react"

const statusConfig: Record<string, { label: string; className: string }> = {
  connected: { label: "Conectado", className: "bg-primary" },
  connecting: { label: "Conectando", className: "bg-muted-foreground" },
  disconnected: { label: "Desconectado", className: "bg-destructive" },
  qr: { label: "Aguardando QR", className: "bg-muted-foreground" },
}

interface SessionProfileCardProps {
  session: ApiSession | null
  loading?: boolean
  actions?: React.ReactNode
}

export function SessionProfileCard({ session, loading, actions }: SessionProfileCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyApiKey = () => {
    if (session?.apiKey) {
      navigator.clipboard.writeText(session.apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statusInfo = statusConfig[session?.status || "disconnected"] || statusConfig.disconnected

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex items-start gap-4 flex-1">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session?.profilePicture} />
                <AvatarFallback className="text-2xl bg-muted">
                  {(session?.pushName || session?.session || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background ${statusInfo.className}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold truncate">{session?.pushName || session?.session}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-primary-foreground ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {session?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>+{session.phone}</span>
                  </div>
                )}
                {session?.businessName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{session.businessName}</span>
                  </div>
                )}
                {session?.about && (
                  <p className="text-muted-foreground italic">&quot;{session.about}&quot;</p>
                )}
                {session?.platform && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{session.platform}</span>
                  </div>
                )}
              </div>

              {session?.apiKey && (
                <div className="mt-3 flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[200px]">
                    {session.apiKey.slice(0, 16)}...
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyApiKey}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}

              {session?.lastConnectedAt && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Última conexão: {new Date(session.lastConnectedAt).toLocaleString("pt-BR")}</span>
                </div>
              )}
            </div>
          </div>

          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export function SessionProfileCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
