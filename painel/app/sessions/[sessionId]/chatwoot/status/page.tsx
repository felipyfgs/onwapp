"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { SessionSidebar } from "@/components/sessions/session-sidebar"
import { AppHeader } from "@/components/app-header"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSyncStatus, getSyncOverview } from "@/lib/api/chatwoot"
import type { SyncStatus, SyncOverview } from "@/lib/types/chatwoot"
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"

export default function ChatwootStatusPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [loading, setLoading] = React.useState(true)
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus | null>(null)
  const [overview, setOverview] = React.useState<SyncOverview | null>(null)

  const loadData = React.useCallback(async () => {
    try {
      const [status, overviewData] = await Promise.all([
        getSyncStatus(sessionId).catch(() => null),
        getSyncOverview(sessionId).catch(() => null),
      ])
      setSyncStatus(status)
      setOverview(overviewData)
    } catch (error) {
      console.error("Failed to load chatwoot status:", error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Poll sync status if running (less frequently to avoid rate limits)
  React.useEffect(() => {
    if (syncStatus?.status === "running") {
      const interval = setInterval(() => {
        loadData().catch((error) => {
          console.error("Failed to poll sync status:", error)
          // Stop polling on error
          clearInterval(interval)
        })
      }, 5000) // Increased from 2s to 5s
      return () => clearInterval(interval)
    }
  }, [syncStatus?.status, loadData])

  return (
    <SidebarProvider>
      <SessionSidebar sessionId={sessionId} />
      <SidebarInset>
        <AppHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/sessions">Sessões</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}`}>
                  {sessionId}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/sessions/${sessionId}/chatwoot`}>
                  Chatwoot
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Status</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </AppHeader>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              {/* Sync Status */}
              {syncStatus && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Status da Sincronização</CardTitle>
                      <div className="flex items-center gap-2">
                        {syncStatus.status === "running" && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        )}
                        {syncStatus.status === "completed" && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {syncStatus.status === "failed" && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {syncStatus.status === "idle" && (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="capitalize">{syncStatus.status}</span>
                      </div>
                    </div>
                    <CardDescription>
                      Status atual da sincronização entre WhatsApp e Chatwoot
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {syncStatus.stats && (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Contatos Importados</p>
                          <p className="text-2xl font-bold">{syncStatus.stats.contactsImported}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Mensagens Importadas</p>
                          <p className="text-2xl font-bold">{syncStatus.stats.messagesImported}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Conversas Usadas</p>
                          <p className="text-2xl font-bold">{syncStatus.stats.conversationsUsed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Erros</p>
                          <p className="text-2xl font-bold text-red-500">{syncStatus.stats.errors}</p>
                        </div>
                      </div>
                    )}
                    {syncStatus.error && (
                      <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                        <p className="text-sm font-medium text-red-500">Erro:</p>
                        <p className="text-sm text-muted-foreground">{syncStatus.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Overview */}
              {overview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Visão Geral</CardTitle>
                    <CardDescription>
                      Estatísticas gerais da integração
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h3 className="font-medium mb-2">Contatos</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Chatwoot</span>
                            <span className="font-medium">{overview.contacts?.totalChatwoot || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Sincronizados</span>
                            <span className="font-medium">{overview.contacts?.whatsAppSynced || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Grupos</span>
                            <span className="font-medium">{overview.contacts?.groups || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Privados</span>
                            <span className="font-medium">{overview.contacts?.private || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Conversas</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total</span>
                            <span className="font-medium">{overview.conversations?.total || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Abertas</span>
                            <span className="font-medium">{overview.conversations?.open || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Resolvidas</span>
                            <span className="font-medium">{overview.conversations?.resolved || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Pendentes</span>
                            <span className="font-medium">{overview.conversations?.pending || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Mensagens</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total</span>
                            <span className="font-medium">{overview.messages?.total || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Recebidas</span>
                            <span className="font-medium">{overview.messages?.incoming || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Enviadas</span>
                            <span className="font-medium">{overview.messages?.outgoing || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!syncStatus && !overview && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Nenhum dado de sincronização disponível. Configure o Chatwoot primeiro.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

