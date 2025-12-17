"use client"

import { MessageSquare, Users, UsersRound, FileImage } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SessionStatsProps {
  chatsCount?: number
  contactsCount?: number
  groupsCount?: number
  mediaCount?: number
  loading?: boolean
}

export function SessionStats({
  chatsCount = 0,
  contactsCount = 0,
  groupsCount = 0,
  mediaCount = 0,
  loading = false,
}: SessionStatsProps) {
  const stats = [
    {
      title: "Chats",
      value: chatsCount,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Contacts",
      value: contactsCount,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Groups",
      value: groupsCount,
      icon: UsersRound,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Media Files",
      value: mediaCount,
      icon: FileImage,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
