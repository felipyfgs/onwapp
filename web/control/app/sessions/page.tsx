"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SessionList, SessionListRef } from "@/components/sessions/session-list"
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog"

export default function SessionsPage() {
  const sessionListRef = useRef<SessionListRef>(null)

  function handleSessionCreated() {
    sessionListRef.current?.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Sessions</h1>
              <p className="text-sm text-muted-foreground">
                Manage your WhatsApp sessions
              </p>
            </div>
          </div>
          <CreateSessionDialog onSuccess={handleSessionCreated} />
        </div>
      </header>
      <main className="container px-4 py-6">
        <SessionList ref={sessionListRef} />
      </main>
    </div>
  )
}
