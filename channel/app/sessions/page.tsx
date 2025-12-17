"use client"

import { useRef, useState } from "react"
import { Plus, RefreshCw, Search, Filter } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SessionList, SessionListRef } from "@/components/sessions/session-list"
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog"

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sessões</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3 min-w-[200px] max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar sessão..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "connected" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("connected")}
              >
                <Badge variant="default" className="mr-1 px-1.5 py-0 h-4 text-[10px]">•</Badge>
                Conectado
              </Button>
              <Button
                variant={statusFilter === "connecting" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("connecting")}
              >
                <Badge variant="secondary" className="mr-1 px-1.5 py-0 h-4 text-[10px]">•</Badge>
                Conectando
              </Button>
              <Button
                variant={statusFilter === "disconnected" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("disconnected")}
              >
                <Badge variant="destructive" className="mr-1 px-1.5 py-0 h-4 text-[10px]">•</Badge>
                Desconectado
              </Button>

              <Separator orientation="vertical" className="h-6 mx-2" />

              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <CreateSessionDialog onSuccess={handleSessionCreated}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Sessão
                </Button>
              </CreateSessionDialog>
            </div>
          </div>

          <SessionList 
            ref={sessionListRef} 
            searchTerm={searchTerm}
            statusFilter={statusFilter}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
