"use client"

import { useState, useEffect, use } from "react"
import { Loader2, Save, Trash2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import {
  ConfigCard,
  OptionsCard,
  DatabaseCard,
  SyncCard,
  ChatwootSkeleton,
} from "@/components/chatwoot"
import { 
  getChatwootConfig, 
  setChatwootConfig, 
  deleteChatwootConfig,
  syncChatwoot,
  getSyncStatus,
  getSyncOverview,
  resolveAllConversations,
  type ChatwootConfig,
  type SyncStatus,
  type SyncOverview,
} from "@/lib/api/chatwoot"

export default function ChatwootPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [config, setConfig] = useState<ChatwootConfig | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [overview, setOverview] = useState<SyncOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [formData, setFormData] = useState({
    enabled: false,
    url: "",
    token: "",
    account: 0,
    inboxId: 0,
    signAgent: true,
    autoReopen: true,
    startPending: false,
    syncContacts: true,
    syncMessages: true,
    syncDays: 7,
    chatwootDbHost: "",
    chatwootDbPort: 5432,
    chatwootDbUser: "",
    chatwootDbPass: "",
    chatwootDbName: "",
  })

  useEffect(() => {
    async function load() {
      try {
        const [configData, statusData, overviewData] = await Promise.all([
          getChatwootConfig(sessionId).catch(() => null),
          getSyncStatus(sessionId).catch(() => null),
          getSyncOverview(sessionId).catch(() => null),
        ])
        
        if (configData) {
          setConfig(configData)
          setFormData({
            enabled: configData.enabled,
            url: configData.url || "",
            token: configData.token || "",
            account: configData.account || 0,
            inboxId: configData.inboxId || 0,
            signAgent: configData.signAgent ?? true,
            autoReopen: configData.autoReopen ?? true,
            startPending: configData.startPending ?? false,
            syncContacts: configData.syncContacts ?? true,
            syncMessages: configData.syncMessages ?? true,
            syncDays: configData.syncDays || 7,
            chatwootDbHost: configData.chatwootDbHost || "",
            chatwootDbPort: configData.chatwootDbPort || 5432,
            chatwootDbUser: configData.chatwootDbUser || "",
            chatwootDbPass: configData.chatwootDbPass || "",
            chatwootDbName: configData.chatwootDbName || "",
          })
        }
        
        if (statusData) setSyncStatus(statusData)
        if (overviewData) setOverview(overviewData)
      } catch {
        // Silent error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  // Poll sync status when running
  useEffect(() => {
    if (syncStatus?.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const status = await getSyncStatus(sessionId)
          setSyncStatus(status)
          if (status.status !== 'running') {
            setSyncing(false)
            // Refresh overview after sync completes
            const overviewData = await getSyncOverview(sessionId).catch(() => null)
            if (overviewData) setOverview(overviewData)
          }
        } catch {
          // ignore
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [syncStatus?.status, sessionId])

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = await setChatwootConfig(sessionId, formData)
      setConfig(data)
    } catch {
      // Silent error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Remover configuracao do Chatwoot?')) return
    
    setSaving(true)
    try {
      await deleteChatwootConfig(sessionId)
      setConfig(null)
      setFormData({
        enabled: false,
        url: "",
        token: "",
        account: 0,
        inboxId: 0,
        signAgent: true,
        autoReopen: true,
        startPending: false,
        syncContacts: true,
        syncMessages: true,
        syncDays: 7,
        chatwootDbHost: "",
        chatwootDbPort: 5432,
        chatwootDbUser: "",
        chatwootDbPass: "",
        chatwootDbName: "",
      })
    } catch {
      // Silent error
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (type: 'all' | 'contacts' | 'messages') => {
    setSyncing(true)
    try {
      const status = await syncChatwoot(sessionId, type, formData.syncDays)
      setSyncStatus(status)
    } catch {
      setSyncing(false)
    }
  }

  const handleResolveAll = async () => {
    if (!confirm('Resolver todas as conversas abertas?')) return
    try {
      await resolveAllConversations(sessionId)
      // Refresh overview
      const overviewData = await getSyncOverview(sessionId).catch(() => null)
      if (overviewData) setOverview(overviewData)
    } catch {
      // Silent error
    }
  }

  const headerContent = (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Chatwoot</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )

  if (loading) {
    return (
      <>
        {headerContent}
        <ChatwootSkeleton />
      </>
    )
  }

  return (
    <>
      {headerContent}

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Chatwoot</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              <span className="ml-1.5">Salvar</span>
            </Button>
            {config && (
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={saving} className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ConfigCard
            enabled={formData.enabled}
            url={formData.url}
            token={formData.token}
            account={formData.account}
            inboxId={formData.inboxId}
            onEnabledChange={(v) => updateField('enabled', v)}
            onUrlChange={(v) => updateField('url', v)}
            onTokenChange={(v) => updateField('token', v)}
            onAccountChange={(v) => updateField('account', v)}
            onInboxIdChange={(v) => updateField('inboxId', v)}
          />

          <OptionsCard
            signAgent={formData.signAgent}
            autoReopen={formData.autoReopen}
            startPending={formData.startPending}
            syncContacts={formData.syncContacts}
            syncMessages={formData.syncMessages}
            onSignAgentChange={(v) => updateField('signAgent', v)}
            onAutoReopenChange={(v) => updateField('autoReopen', v)}
            onStartPendingChange={(v) => updateField('startPending', v)}
            onSyncContactsChange={(v) => updateField('syncContacts', v)}
            onSyncMessagesChange={(v) => updateField('syncMessages', v)}
          />

          <DatabaseCard
            host={formData.chatwootDbHost}
            port={formData.chatwootDbPort}
            user={formData.chatwootDbUser}
            pass={formData.chatwootDbPass}
            name={formData.chatwootDbName}
            onHostChange={(v) => updateField('chatwootDbHost', v)}
            onPortChange={(v) => updateField('chatwootDbPort', v)}
            onUserChange={(v) => updateField('chatwootDbUser', v)}
            onPassChange={(v) => updateField('chatwootDbPass', v)}
            onNameChange={(v) => updateField('chatwootDbName', v)}
          />

          <SyncCard
            syncStatus={syncStatus}
            overview={overview}
            enabled={formData.enabled}
            hasDbConfig={!!formData.chatwootDbHost}
            syncing={syncing}
            syncDays={formData.syncDays}
            onSyncDaysChange={(v) => updateField('syncDays', v)}
            onSyncAll={() => handleSync('all')}
            onSyncContacts={() => handleSync('contacts')}
            onSyncMessages={() => handleSync('messages')}
            onResolveAll={handleResolveAll}
          />
        </div>
      </div>
    </>
  )
}
