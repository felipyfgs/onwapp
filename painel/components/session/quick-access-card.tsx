"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  columns?: 2 | 3 | 4
}

export function QuickAccessCard({ title = "Acesso Rápido", links, columns = 3 }: QuickAccessCardProps) {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className={`grid gap-2 ${gridClass}`}>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <link.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">{link.title}</span>
                  {link.description && (
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {link.count !== undefined && (
                  <span className="text-sm text-muted-foreground">{link.count}</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
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
      <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <span className="font-medium">{title}</span>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="text-sm text-muted-foreground">{count}</span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  )
}
