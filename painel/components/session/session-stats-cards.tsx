"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  href?: string
}

export function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

interface IntegrationStatCardProps {
  title: string
  icon: LucideIcon
  integrations: Array<{
    icon: LucideIcon
    enabled: boolean
    label?: string
  }>
}

export function IntegrationStatCard({ title, icon: Icon, integrations }: IntegrationStatCardProps) {
  const enabledCount = integrations.filter(i => i.enabled).length

  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-center h-12 w-12 shrink-0 rounded-xl bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-3xl font-bold">{enabledCount}/{integrations.length}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  )
}
