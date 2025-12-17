"use client"

import * as React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronsUpDown, ArrowLeft, Check } from "lucide-react"

import { Session, getSessions } from "@/lib/api/sessions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface SessionSwitcherProps {
  sessionId: string
}

function getInitials(name?: string): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getStatusColor(status: Session["status"]) {
  switch (status) {
    case "connected":
      return "bg-green-500"
    case "connecting":
      return "bg-yellow-500"
    case "disconnected":
    default:
      return "bg-red-500"
  }
}

export function SessionSwitcher({ sessionId }: SessionSwitcherProps) {
  const { isMobile } = useSidebar()
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)

  useEffect(() => {
    async function fetchSessions() {
      const response = await getSessions()
      if (response.success && response.data) {
        setSessions(response.data)
        const current = response.data.find((s) => s.session === sessionId)
        setCurrentSession(current || null)
      }
    }
    fetchSessions()
  }, [sessionId])

  if (!currentSession) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href="/sessions">
              <ArrowLeft className="size-4" />
              <span>Back to Sessions</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={currentSession.profilePictureUrl} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(currentSession.pushName || currentSession.session)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar ${getStatusColor(currentSession.status)}`}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentSession.session}
                </span>
                <span className="truncate text-xs">
                  {currentSession.pushName || currentSession.status}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Sessions
            </DropdownMenuLabel>
            {sessions.map((session) => (
              <DropdownMenuItem key={session.id} asChild>
                <Link
                  href={`/sessions/${session.session}`}
                  className="flex items-center gap-2 p-2"
                >
                  <div className="relative">
                    <Avatar className="h-6 w-6 rounded-md">
                      <AvatarImage src={session.profilePictureUrl} />
                      <AvatarFallback className="rounded-md text-xs">
                        {getInitials(session.pushName || session.session)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${getStatusColor(session.status)}`}
                    />
                  </div>
                  <span className="flex-1 truncate">{session.session}</span>
                  {session.session === sessionId && (
                    <Check className="h-4 w-4" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/sessions" className="gap-2 p-2">
                <ArrowLeft className="size-4" />
                <span className="text-muted-foreground">All Sessions</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
