"use client"

import Link from "next/link"
import { ChevronRight, LucideIcon } from "lucide-react"

interface QuickAccessLink {
  title: string
  href: string
  icon: LucideIcon
  count?: number
  description?: string
}

interface QuickAccessCardProps {
  title?: string
  links: QuickAccessLink[]
}

export function QuickAccessCard({ title, links }: QuickAccessCardProps) {
  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
      <div className="grid gap-2 md:grid-cols-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="group flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted group-hover:bg-background transition-colors">
                  <link.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{link.title}</p>
                  {link.description && (
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {link.count !== undefined && (
                  <span className="text-sm font-medium text-muted-foreground">{link.count}</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

interface QuickAccessItemProps {
  href: string
  icon: LucideIcon
  title: string
  count?: number
  description?: string
}

export function QuickAccessItem({ href, icon: Icon, title, count, description }: QuickAccessItemProps) {
  return (
    <Link href={href}>
      <div className="group flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted group-hover:bg-background transition-colors">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="text-sm font-medium text-muted-foreground">{count}</span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
