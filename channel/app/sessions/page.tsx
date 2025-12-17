"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, RefreshCw, Search, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SessionList, SessionListRef } from "@/components/sessions/session-list"
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog"
import { ModeToggle } from "@/components/mode-toggle"

export default function SessionsPage() {
  const sessionListRef = useRef<SessionListRef>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "connecting" | "disconnected">("all")

  function handleSessionCreated() {
    sessionListRef.current?.refresh()
  }

  function handleRefresh() {
    sessionListRef.current?.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">Sessões WhatsApp</h1>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <CreateSessionDialog onSuccess={handleSessionCreated}>
              <Button size="sm" className="h-8">
                <Plus className="mr-2 h-4 w-4" />
                Nova
              </Button>
            </CreateSessionDialog>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-t bg-background">
          <div className="container mx-auto px-6 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar sessão..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant={statusFilter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8"
                  onClick={() => setStatusFilter("all")}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === "connected" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8"
                  onClick={() => setStatusFilter("connected")}
                >
                  <Badge variant="default" className="mr-1 px-1.5 py-0 h-4 text-[10px]">•</Badge>
                  Conectado
                </Button>
                <Button
                  variant={statusFilter === "connecting" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8"
                  onClick={() => setStatusFilter("connecting")}
                >
                  <Badge variant="secondary" className="mr-1 px-1.5 py-0 h-4 text-[10px]">•</Badge>
                  Conectando
                </Button>
                <Button
                  variant={statusFilter === "disconnected" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8"
                  onClick={() => setStatusFilter("disconnected")}
                >
                  <Badge variant="destructive" className="mr-1 px-1.5 py-0 h-4 text-[10px]">•</Badge>
                  Desconectado
                </Button>
              </div>

              {/* Refresh */}
              <Button variant="outline" size="sm" className="h-8" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <SessionList 
          ref={sessionListRef} 
          searchTerm={searchTerm}
          statusFilter={statusFilter}
        />
      </main>
    </div>
  )
}
