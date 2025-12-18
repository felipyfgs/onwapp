"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ConnectionItem {
  title: string
  description: string
  status: "active" | "pending" | "error"
  details: {
    lastSync: string
    info: string
  }
}

const mockConnections: ConnectionItem[] = [
  {
    title: "API Integration",
    description: "Connected via OAuth 2.0",
    status: "active",
    details: {
      lastSync: "Last sync: 5 minutes ago",
      info: "API endpoints: 12 active",
    },
  },
  {
    title: "Webhook Service",
    description: "Awaiting configuration",
    status: "pending",
    details: {
      lastSync: "Setup required",
      info: "0 endpoints configured",
    },
  },
  {
    title: "Database Sync",
    description: "PostgreSQL connection",
    status: "active",
    details: {
      lastSync: "Last sync: 1 minute ago",
      info: "Tables: 8 synced",
    },
  },
  {
    title: "Cloud Storage",
    description: "Authentication failed",
    status: "error",
    details: {
      lastSync: "Last attempt: 2 hours ago",
      info: "Status: 401 Unauthorized",
    },
  },
]

const statusVariants = {
  active: "default",
  pending: "secondary",
  error: "destructive",
} as const

export function ConnectionList() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {mockConnections.map((connection, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{connection.title}</CardTitle>
              <Badge variant={statusVariants[connection.status]}>
                {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
              </Badge>
            </div>
            <CardDescription>{connection.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">{connection.details.lastSync}</p>
              <p className="text-sm text-muted-foreground">{connection.details.info}</p>
              <Button variant="outline" size="sm">
                {connection.status === "error" ? "Reconnect" : connection.status === "pending" ? "Setup" : "Configure"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ConnectionHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Connections</h2>
      <Button>Add Connection</Button>
    </div>
  )
}
