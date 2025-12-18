"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  description: string
  value: string | number
}

export function StatsCard({ title, description, value }: StatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function StatsGrid() {
  const stats = [
    { title: "Total Chats", description: "127 active conversations", value: "127" },
    { title: "Connections", description: "45 active connections", value: "45" },
    { title: "Contacts", description: "892 total contacts", value: "892" },
  ]

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  )
}
