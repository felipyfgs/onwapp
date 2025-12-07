"use client"

import { useState, useEffect, use, useCallback } from "react"
import { AlertCircle } from "lucide-react"
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
import { ProfileCard, PrivacyCard, BehaviorCard, SettingsSkeleton } from "@/components/settings"
import {
  getSessionProfile,
  getSessionSettings,
  updateSessionSettings,
  type SessionSettings,
  type UpdateSettingsRequest,
} from "@/lib/api/sessions"

interface Profile {
  phone?: string
  pushName?: string
  status?: string
  pictureUrl?: string
}

export default function SettingsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [profile, setProfile] = useState<Profile>({})
  const [settings, setSettings] = useState<SessionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load profile
      try {
        const profileData = await getSessionProfile(sessionId)
        const profileObj = (profileData as any).profile || profileData
        setProfile({
          phone: profileObj.jid?.split(":")[0] || profileObj.phone,
          pushName: profileObj.pushName,
          status: profileObj.status,
          pictureUrl: profileObj.pictureUrl,
        })
        setIsConnected(true)
      } catch {
        setIsConnected(false)
      }

      // Load settings
      try {
        const settingsData = await getSessionSettings(sessionId)
        setSettings(settingsData)
      } catch {
        // Settings may not exist yet
      }
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSettingsChange = async (updates: UpdateSettingsRequest) => {
    // Optimistic update
    setSettings((prev) => prev ? { ...prev, ...updates } : null)
    
    // Save immediately
    try {
      const updatedSettings = await updateSessionSettings(sessionId, updates)
      setSettings(updatedSettings)
    } catch {
      // Revert on error - reload settings
      loadData()
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
              <BreadcrumbLink href="/sessions">Sessoes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={`/sessions/${sessionId}`}>{sessionId}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Configuracoes</BreadcrumbPage>
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
        <SettingsSkeleton />
      </>
    )
  }

  return (
    <>
      {headerContent}

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <h1 className="text-lg font-semibold">Configuracoes</h1>

        {/* Alert */}
        {!isConnected && (
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-3 py-2 rounded-md text-xs">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>Sessao desconectada</span>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ProfileCard
            sessionId={sessionId}
            phone={profile.phone}
            pushName={profile.pushName}
            status={profile.status}
            pictureUrl={profile.pictureUrl}
            onUpdate={loadData}
          />

          <BehaviorCard
            settings={settings}
            onChange={handleSettingsChange}
            disabled={!isConnected}
          />

          <div className="lg:col-span-2">
            <PrivacyCard
              settings={settings}
              onChange={handleSettingsChange}
              disabled={!isConnected}
            />
          </div>
        </div>
      </div>
    </>
  )
}
