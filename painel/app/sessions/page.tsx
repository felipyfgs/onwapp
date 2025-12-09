"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Plus } from "lucide-react"
import {
  Session,
  FilterStatus,
  SessionStatsCards,
  SessionFilters,
  SessionList,
} from "@/components/sessions"

const sessions: Session[] = [
  {
    id: "session-01",
    name: "Atendimento Principal",
    phone: "+55 11 99999-9999",
    status: "connected",
    lastActivity: "Agora",
    messagesCount: 1234,
  },
  {
    id: "session-02", 
    name: "Vendas",
    phone: "+55 11 88888-8888",
    status: "connected",
    lastActivity: "5 min atras",
    messagesCount: 567,
  },
  {
    id: "session-03",
    name: "Suporte",
    phone: null,
    status: "disconnected",
    lastActivity: "2 horas atras",
    messagesCount: 0,
  },
  {
    id: "session-04",
    name: "Marketing",
    phone: null,
    status: "qr_pending",
    lastActivity: "Aguardando QR",
    messagesCount: 0,
  },
]

export default function SessionsPage() {
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [search, setSearch] = useState("")

  const filteredSessions = sessions.filter((session) => {
    const matchesFilter = filter === "all" || session.status === filter
    const matchesSearch = session.name.toLowerCase().includes(search.toLowerCase()) ||
      session.phone?.includes(search) ||
      session.id.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: sessions.length,
    connected: sessions.filter(s => s.status === "connected").length,
    disconnected: sessions.filter(s => s.status === "disconnected").length,
    pending: sessions.filter(s => s.status === "qr_pending").length,
  }

  const hasFilters = search !== "" || filter !== "all"

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
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
                  <BreadcrumbPage>Sessions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessao
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <SessionStatsCards stats={stats} onFilterChange={setFilter} />
        
        <SessionFilters
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />

        <SessionList sessions={filteredSessions} hasFilters={hasFilters} />
      </div>
    </>
  )
}
