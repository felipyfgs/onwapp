'use client'

import { useState } from 'react'
import {
  IconPlugConnected,
  IconPlugConnectedX,
  IconQrcode,
  IconLoader2,
  IconTrash,
  IconMessage,
  IconUsers,
  IconMessageCircle,
  IconUsersGroup,
  IconExternalLink,
} from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Session, SessionStatusType } from '@/lib/types'

interface SessionCardProps {
  session: Session
  onConnect: (name: string) => Promise<void>
  onDisconnect: (name: string) => Promise<void>
  onDelete: (name: string) => Promise<void>
  onShowQR: (name: string) => void
}

const statusConfig: Record<SessionStatusType, {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: typeof IconPlugConnected
  dotColor: string
}> = {
  connected: {
    label: 'Conectado',
    variant: 'default',
    icon: IconPlugConnected,
    dotColor: 'bg-green-500',
  },
  disconnected: {
    label: 'Desconectado',
    variant: 'destructive',
    icon: IconPlugConnectedX,
    dotColor: 'bg-red-500',
  },
  qr_pending: {
    label: 'Aguardando QR',
    variant: 'secondary',
    icon: IconQrcode,
    dotColor: 'bg-yellow-500',
  },
  connecting: {
    label: 'Conectando',
    variant: 'outline',
    icon: IconLoader2,
    dotColor: 'bg-blue-500 animate-pulse',
  },
}

function getInitials(name: string): string {
  return name
    .split(/[-_\s]/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function SessionCard({
  session,
  onConnect,
  onDisconnect,
  onDelete,
  onShowQR,
}: SessionCardProps) {
  const [loading, setLoading] = useState(false)
  const config = statusConfig[session.status] || statusConfig.disconnected

  const handleAction = async (e: React.MouseEvent, action: () => Promise<void>) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await action()
    } finally {
      setLoading(false)
    }
  }

  const stats = session.stats || { messages: 0, chats: 0, contacts: 0, groups: 0 }
  const showStats = session.status === 'connected'

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="group transition-all hover:shadow-md hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={session.profilePicture} alt={session.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {getInitials(session.pushName || session.name)}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background ${config.dotColor}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate text-base">
                  {session.pushName || session.name}
                </h3>
                <IconExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
              </div>
              {session.phone ? (
                <p className="text-sm text-muted-foreground font-mono truncate">
                  +{session.phone.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '$1 $2 $3-$4')}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">
                  {session.name}
                </p>
              )}
              <Badge variant={config.variant} className="mt-1.5 gap-1 text-xs">
                <config.icon className={`h-3 w-3 ${session.status === 'connecting' ? 'animate-spin' : ''}`} />
                {config.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Stats - only show for connected sessions */}
          {showStats && (
            <div className="grid grid-cols-4 gap-1 py-2 px-1 bg-muted/50 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5 cursor-default">
                    <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{formatNumber(stats.chats)}</span>
                    <span className="text-[10px] text-muted-foreground">Chats</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stats.chats.toLocaleString()} conversas</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5 cursor-default">
                    <IconUsers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{formatNumber(stats.contacts)}</span>
                    <span className="text-[10px] text-muted-foreground">Contatos</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stats.contacts.toLocaleString()} contatos</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5 cursor-default">
                    <IconUsersGroup className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{formatNumber(stats.groups)}</span>
                    <span className="text-[10px] text-muted-foreground">Grupos</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stats.groups.toLocaleString()} grupos</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5 cursor-default">
                    <IconMessage className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{formatNumber(stats.messages)}</span>
                    <span className="text-[10px] text-muted-foreground">Msgs</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stats.messages.toLocaleString()} mensagens</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Actions */}
          <div className={`flex items-center justify-between gap-1 ${showStats ? 'pt-1' : 'pt-2 border-t'}`}>
            <div className="flex items-center gap-1">
              {/* Conectar */}
              {session.status === 'disconnected' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:border-green-900 dark:hover:bg-green-950 dark:hover:border-green-800"
                      onClick={(e) => handleAction(e, () => onConnect(session.name))}
                      disabled={loading}
                    >
                      {loading ? (
                        <IconLoader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <IconPlugConnected className="h-4 w-4 mr-1" />
                      )}
                      Conectar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Iniciar conexao</TooltipContent>
                </Tooltip>
              )}

              {/* Desconectar */}
              {session.status === 'connected' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={(e) => handleAction(e, () => onDisconnect(session.name))}
                      disabled={loading}
                    >
                      <IconPlugConnectedX className="h-4 w-4 mr-1" />
                      Desconectar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Encerrar conexao</TooltipContent>
                </Tooltip>
              )}

              {/* QR Code */}
              {(session.status === 'qr_pending' || session.status === 'connecting') && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:border-blue-900 dark:hover:bg-blue-950 dark:hover:border-blue-800"
                      onClick={(e) => {
                        e.stopPropagation()
                        onShowQR(session.name)
                      }}
                    >
                      <IconQrcode className="h-4 w-4 mr-1" />
                      QR Code
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Escanear QR Code</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Excluir */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleAction(e, () => onDelete(session.name))}
                  disabled={loading}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir sessao</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
