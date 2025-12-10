"use client"

import { ApiSession } from "@/lib/api/sessions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Phone, Building2, Copy, Key } from "lucide-react"
import { useState } from "react"

const statusConfig: Record<string, { label: string; dotClass: string; bgClass: string }> = {
  connected: { label: "Conectado", dotClass: "bg-primary", bgClass: "bg-primary/10 text-primary" },
  connecting: { label: "Conectando", dotClass: "bg-yellow-500", bgClass: "bg-yellow-500/10 text-yellow-600" },
  disconnected: { label: "Desconectado", dotClass: "bg-destructive", bgClass: "bg-destructive/10 text-destructive" },
  qr: { label: "Aguardando QR", dotClass: "bg-yellow-500", bgClass: "bg-yellow-500/10 text-yellow-600" },
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
      <div className="flex items-center justify-between p-5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2.5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl border border-border bg-card md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.profilePicture} />
            <AvatarFallback className="text-xl bg-muted">
              {(session?.pushName || session?.session || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-card ${statusInfo.dotClass}`} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-semibold truncate">{session?.pushName || session?.session}</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            {session?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                +{session.phone}
              </span>
            )}
            {session?.businessName && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {session.businessName}
              </span>
            )}
            {session?.platform && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded">{session.platform}</span>
            )}
            {session?.apiKey && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleCopyApiKey}
              >
                <Key className="h-3.5 w-3.5 mr-1" />
                {copied ? "Copiado!" : "API Key"}
                {!copied && <Copy className="h-3.5 w-3.5 ml-1" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function SessionProfileCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-5 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}
