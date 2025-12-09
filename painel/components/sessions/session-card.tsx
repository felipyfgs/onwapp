"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Power, Trash2, ChevronRight } from "lucide-react"
import { Session, statusConfig } from "./types"
import { cn } from "@/lib/utils"

interface SessionCardProps {
  session: Session
  isLast: boolean
}

function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase()
}

const statusDot = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500",
  disconnected: "bg-red-500",
} as const

export function SessionCard({ session, isLast }: SessionCardProps) {
  const config = statusConfig[session.status]
  const displayName = session.pushName || session.session

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.preventDefault()
    e.stopPropagation()
    console.log(`Action: ${action} for session ${session.session}`)
  }

  return (
    <Link
      href={`/sessions/${session.session}`}
      className={cn(
        "flex items-center justify-between py-3 px-4 transition-colors hover:bg-muted/30",
        !isLast && "border-b border-border/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">
          {getInitials(displayName)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{displayName}</span>
            <div className={cn("h-1.5 w-1.5 rounded-full", statusDot[session.status])} />
          </div>
          <p className="text-xs text-muted-foreground">{config.label}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-7 w-7",
            session.status === "connected"
              ? "text-green-500 hover:text-green-600 hover:bg-green-500/10"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={(e) => handleAction(e, session.status === "connected" ? "disconnect" : "connect")}
        >
          <Power className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
          onClick={(e) => handleAction(e, "delete")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Link>
  )
}
