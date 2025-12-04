'use client'

import {
  IconDeviceMobile,
  IconPlugConnected,
  IconPlugConnectedX,
  IconQrcode,
} from '@tabler/icons-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Session } from '@/lib/types'

interface StatsCardsProps {
  sessions: Session[]
}

export function StatsCards({ sessions }: StatsCardsProps) {
  const total = sessions.length
  const connected = sessions.filter((s) => s.status === 'connected').length
  const disconnected = sessions.filter((s) => s.status === 'disconnected').length
  const pending = sessions.filter((s) => s.status === 'qr_pending' || s.status === 'connecting').length

  const stats = [
    {
      title: 'Total de Sessoes',
      value: total,
      icon: IconDeviceMobile,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Conectadas',
      value: connected,
      icon: IconPlugConnected,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Desconectadas',
      value: disconnected,
      icon: IconPlugConnectedX,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Aguardando QR',
      value: pending,
      icon: IconQrcode,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardDescription className="text-sm font-medium">
                {stat.title}
              </CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {stat.value}
              </CardTitle>
            </div>
            <div className={`rounded-full p-3 ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
